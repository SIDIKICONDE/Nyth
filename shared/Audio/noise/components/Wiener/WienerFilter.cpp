#include "WienerFilter.hpp"
#include "../../common/utils/MathUtils.hpp"
#include <algorithm>

namespace AudioNR {

WienerFilter::WienerFilter(const Config& cfg) : cfg_(cfg) {
    numBins_ = cfg_.fftSize / 2 + 1;

    // Initialize state vectors
    xi_.resize(numBins_, WienerFilterConstants::INITIAL_SNR_VALUE);
    gamma_.resize(numBins_, WienerFilterConstants::INITIAL_SNR_VALUE);
    G_.resize(numBins_, WienerFilterConstants::INITIAL_GAIN_VALUE);
    Gprev_.resize(numBins_, WienerFilterConstants::INITIAL_GAIN_VALUE);
    lambda_n_.resize(numBins_, WienerFilterConstants::INITIAL_NOISE_VALUE);
    S_prev_.resize(numBins_, WienerFilterConstants::INITIAL_SPEECH_VALUE);
    v_.resize(numBins_, WienerFilterConstants::INITIAL_GAIN_VALUE);
    GH1_.resize(numBins_, WienerFilterConstants::INITIAL_GAIN_VALUE);

    // Initialize perceptual weights
    initializePerceptualWeights();

    // Initialize noise estimator if using IMCRA
    if (cfg_.noiseMode == Config::IMCRA_FULL) {
        IMCRA::Config imcraCfg;
        imcraCfg.fftSize = cfg_.fftSize;
        imcraCfg.sampleRate = cfg_.sampleRate;
        imcra_ = std::make_unique<IMCRA>(imcraCfg);
    }
}

WienerFilter::~WienerFilter() = default;

void WienerFilter::reset() {
    std::fill(xi_.begin(), xi_.end(), WienerFilterConstants::INITIAL_SNR_VALUE);
    std::fill(gamma_.begin(), gamma_.end(), WienerFilterConstants::INITIAL_SNR_VALUE);
    std::fill(G_.begin(), G_.end(), WienerFilterConstants::INITIAL_GAIN_VALUE);
    std::fill(Gprev_.begin(), Gprev_.end(), WienerFilterConstants::INITIAL_GAIN_VALUE);
    std::fill(lambda_n_.begin(), lambda_n_.end(), WienerFilterConstants::INITIAL_NOISE_VALUE);
    std::fill(S_prev_.begin(), S_prev_.end(), WienerFilterConstants::INITIAL_SPEECH_VALUE);
    std::fill(v_.begin(), v_.end(), WienerFilterConstants::INITIAL_GAIN_VALUE);
    std::fill(GH1_.begin(), GH1_.end(), WienerFilterConstants::INITIAL_GAIN_VALUE);

    if (imcra_) {
        imcra_->reset();
    }
}

void WienerFilter::setConfig(const Config& cfg) {
    cfg_ = cfg;
    reset();
}

void WienerFilter::processSpectrum(const std::vector<float>& realIn, const std::vector<float>& imagIn,
                                   std::vector<float>& realOut, std::vector<float>& imagOut) {
    if (realIn.size() != numBins_ || imagIn.size() != numBins_) {
        throw std::invalid_argument("Input spectrum size mismatch");
    }

    realOut.resize(numBins_);
    imagOut.resize(numBins_);

    // Convert to magnitude
    std::vector<float> magnitude(numBins_);
    for (size_t k = 0; k < numBins_; ++k) {
        magnitude[k] = std::sqrt(realIn[k] * realIn[k] + imagIn[k] * imagIn[k]);
    }

    // Process magnitude spectrum
    std::vector<float> outputMagnitude(numBins_);
    processMagnitudePhase(magnitude, {}, outputMagnitude);

    // Apply gains to complex spectrum
    for (size_t k = 0; k < numBins_; ++k) {
        float gain = outputMagnitude[k] / max(magnitude[k], WienerFilterConstants::EPSILON_PROTECTION);
        realOut[k] = realIn[k] * gain;
        imagOut[k] = imagIn[k] * gain;
    }
}

void WienerFilter::processMagnitudePhase(const std::vector<float>& magnitude, const std::vector<float>& phase,
                                         std::vector<float>& outputMagnitude) {
    if (magnitude.size() != numBins_) {
        throw std::invalid_argument("Magnitude spectrum size mismatch");
    }

    outputMagnitude.resize(numBins_);

    // Update noise estimate
    updateNoiseEstimate(magnitude);

    // Compute a priori and a posteriori SNR
    computeAPrioriSNR(magnitude);

    // Compute Wiener gain
    if (cfg_.useLSA) {
        computeMMSE_LSA_Gain();
    } else {
        computeWienerGain();
    }

    // Apply gain smoothing
    applyGainSmoothing();

    // Apply gains to magnitude spectrum
    for (size_t k = 0; k < numBins_; ++k) {
        outputMagnitude[k] = magnitude[k] * G_[k];
    }
}

void WienerFilter::initializePerceptualWeights() {
    perceptualWeight_.resize(numBins_);

    // Create perceptual weighting based on A-weighting curve approximation
    float nyquist = cfg_.sampleRate / 2.0f;

    for (size_t k = 0; k < numBins_; ++k) {
        float freq = k * nyquist / (numBins_ - 1);

        // Simplified A-weighting approximation
        float f2 = freq * freq;
        float f4 = f2 * f2;

        float num = 12194.0f * 12194.0f * f4;
        float den = (f2 + 20.6f * 20.6f) * std::sqrt((f2 + 107.7f * 107.7f) * (f2 + 737.9f * 737.9f)) *
                    (f2 + 12194.0f * 12194.0f);

        float aWeight = num / max(den, 1e-10f);

        // Normalize and apply perceptual factor
        perceptualWeight_[k] = 1.0f + cfg_.perceptualFactor * (aWeight - 1.0f);
        perceptualWeight_[k] = clamp(perceptualWeight_[k], WienerFilterConstants::PERCEPTUAL_WEIGHT_MIN,
                                     WienerFilterConstants::PERCEPTUAL_WEIGHT_MAX);
    }
}

void WienerFilter::updateNoiseEstimate(const std::vector<float>& magnitude) {
    if (cfg_.noiseMode == Config::IMCRA_FULL && imcra_) {
        // Use IMCRA for noise estimation
        std::vector<float> noiseSpectrum(numBins_);
        std::vector<float> speechProbability(numBins_);

        imcra_->processFrame(magnitude, noiseSpectrum, speechProbability);

        // Convert to power spectrum
        for (size_t k = 0; k < numBins_; ++k) {
            lambda_n_[k] = noiseSpectrum[k] * noiseSpectrum[k];
        }
    } else {
        // Simple recursive averaging
        float alpha = WienerFilterConstants::NOISE_UPDATE_ALPHA;
        for (size_t k = 0; k < numBins_; ++k) {
            float Y2 = magnitude[k] * magnitude[k];

            // Simple VAD based on energy threshold
            float threshold = WienerFilterConstants::VAD_THRESHOLD_FACTOR * lambda_n_[k];
            if (Y2 < threshold || lambda_n_[k] == 0.0f) {
                // Update noise estimate
                lambda_n_[k] = alpha * lambda_n_[k] + (1.0f - alpha) * Y2;
            }
        }
    }
}

void WienerFilter::computeAPrioriSNR(const std::vector<float>& magnitude) {
    for (size_t k = 0; k < numBins_; ++k) {
        float Y2 = magnitude[k] * magnitude[k];

        // A posteriori SNR
        gamma_[k] = Y2 / max(lambda_n_[k], WienerFilterConstants::EPSILON_PROTECTION);

        // Decision-directed a priori SNR estimation
        // ξ[k,n] = α * G²[k,n-1] * γ[k,n-1] + (1-α) * max(γ[k,n] - 1, 0)
        float xiDD = cfg_.alpha * Gprev_[k] * Gprev_[k] * gamma_[k];
        float xiML = max(gamma_[k] - 1.0f, 0.0f);

        xi_[k] = xiDD + (1.0f - cfg_.alpha) * xiML;

        // Apply constraints
        xi_[k] = clamp(xi_[k], cfg_.xiMin, cfg_.xiMax);

        // Apply perceptual weighting
        if (cfg_.usePerceptualWeighting) {
            xi_[k] *= perceptualWeight_[k];
        }
    }
}

void WienerFilter::computeWienerGain() {
    // Standard Wiener filter gain: G = ξ / (1 + ξ)
    for (size_t k = 0; k < numBins_; ++k) {
        G_[k] = xi_[k] / (1.0f + xi_[k]);

        // Apply gain constraints
        G_[k] = clamp(G_[k], cfg_.minGain, cfg_.maxGain);
    }
}

void WienerFilter::computeMMSE_LSA_Gain() {
    // MMSE-LSA (Log-Spectral Amplitude) estimator
    // More perceptually motivated than standard Wiener filter

    for (size_t k = 0; k < numBins_; ++k) {
        // Compute v = ξ/(1+ξ) * γ
        v_[k] = xi_[k] / (1.0f + xi_[k]) * gamma_[k];

        // Compute gain using exponential integral
        // G_LSA = ξ/(1+ξ) * exp(0.5 * E1(v))
        // where E1 is the exponential integral

        float expint_v = MathUtils::expint(v_[k]);
        GH1_[k] = xi_[k] / (1.0f + xi_[k]) * std::exp(0.5f * expint_v);

        // Alternative formulation for numerical stability
        if (v_[k] < WienerFilterConstants::EXPINT_SMALL_THRESHOLD) {
            // Small v approximation
            GH1_[k] = v_[k] / (1.0f + v_[k]);
        }

        G_[k] = GH1_[k];

        // Apply gain constraints
        G_[k] = clamp(G_[k], cfg_.minGain, cfg_.maxGain);
    }
}

void WienerFilter::applyGainSmoothing() {
    // Temporal smoothing
    for (size_t k = 0; k < numBins_; ++k) {
        G_[k] = cfg_.gainSmoothing * Gprev_[k] + (1.0f - cfg_.gainSmoothing) * G_[k];
    }

    // Frequency smoothing (3-point median filter)
    if (cfg_.frequencySmoothing > 0.0f) {
        std::vector<float> smoothedGains(numBins_);

        for (size_t k = 1; k < numBins_ - 1; ++k) {
            // Simple 3-point weighted average
            smoothedGains[k] = cfg_.frequencySmoothing * WienerFilterConstants::FREQUENCY_SMOOTHING_WEIGHT *
                                   (G_[k - 1] + 2 * G_[k] + G_[k + 1]) +
                               (1.0f - cfg_.frequencySmoothing) * G_[k];
        }

        // Handle boundaries
        smoothedGains[0] = G_[0];
        smoothedGains[numBins_ - 1] = G_[numBins_ - 1];

        G_ = smoothedGains;
    }

    // Store for next iteration
    Gprev_ = G_;
}

// Two-Step Noise Reduction Implementation

TwoStepNoiseReduction::TwoStepNoiseReduction(const Config& cfg) : cfg_(cfg) {
    // Configure first step (conservative)
    WienerFilter::Config step1Config;
    step1Config.fftSize = cfg_.fftSize;
    step1Config.sampleRate = cfg_.sampleRate;
    step1Config.minGain = cfg_.step1MinGain;
    step1Config.alpha = cfg_.step1Alpha;
    step1Config.useLSA = true;
    step1Filter_ = std::make_unique<WienerFilter>(step1Config);

    // Configure second step (aggressive)
    WienerFilter::Config step2Config;
    step2Config.fftSize = cfg_.fftSize;
    step2Config.sampleRate = cfg_.sampleRate;
    step2Config.minGain = cfg_.step2MinGain;
    step2Config.alpha = cfg_.step2Alpha;
    step2Config.useLSA = true;
    step2Filter_ = std::make_unique<WienerFilter>(step2Config);

    // Initialize buffers
    size_t numBins = cfg_.fftSize / 2 + 1;
    intermediateMagnitude_.resize(numBins);
    residualNoise_.resize(numBins, 0.0f);
}

TwoStepNoiseReduction::~TwoStepNoiseReduction() = default;

void TwoStepNoiseReduction::process(const std::vector<float>& magnitude, const std::vector<float>& phase,
                                    std::vector<float>& outputMagnitude) {
    // Step 1: Conservative Wiener filtering
    step1Filter_->processMagnitudePhase(magnitude, phase, intermediateMagnitude_);

    // Estimate residual noise
    estimateResidualNoise(magnitude, intermediateMagnitude_);

    // Step 2: Aggressive filtering on residual
    step2Filter_->processMagnitudePhase(intermediateMagnitude_, phase, outputMagnitude);
}

void TwoStepNoiseReduction::estimateResidualNoise(const std::vector<float>& original,
                                                  const std::vector<float>& filtered) {
    for (size_t k = 0; k < original.size(); ++k) {
        // Compute residual
        float residual = original[k] - filtered[k];

        // Update residual noise estimate with smoothing
        if (residual > cfg_.residualThreshold * residualNoise_[k]) {
            residualNoise_[k] =
                cfg_.residualSmoothing * residualNoise_[k] + (1.0f - cfg_.residualSmoothing) * std::abs(residual);
        }
    }
}

void TwoStepNoiseReduction::getStepGains(std::vector<float>& step1Gains, std::vector<float>& step2Gains) const {
    step1Gains = step1Filter_->getGains();
    step2Gains = step2Filter_->getGains();
}

} // namespace AudioNR
