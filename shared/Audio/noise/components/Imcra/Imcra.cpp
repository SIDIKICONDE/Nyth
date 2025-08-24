#include "IMCRA.hpp"
#include <algorithm>
#include <cmath>
#include <stdexcept>
#include <vector>

namespace AudioNR {

IMCRA::IMCRA(const Config& cfg) : cfg_(cfg), frameCount_(0), subwc_(0) {
    numBins_ = cfg_.fftSize / 2 + 1;

    // Initialize all vectors
    S_.resize(numBins_, IMCRAConstants::ZERO_VALUE);
    Smin_.resize(numBins_, IMCRAConstants::INITIAL_MINIMUM_VALUE);
    Stmp_.resize(numBins_, IMCRAConstants::INITIAL_MINIMUM_VALUE);
    lambda_d_.resize(numBins_, IMCRAConstants::ZERO_VALUE);

    xi_.resize(numBins_, IMCRAConstants::INITIAL_SNR_VALUE);
    gamma_.resize(numBins_, IMCRAConstants::INITIAL_SNR_VALUE);
    GH1_.resize(numBins_, IMCRAConstants::INITIAL_GAIN);

    q_.resize(numBins_, IMCRAConstants::INITIAL_PROBABILITY);
    p_.resize(numBins_, IMCRAConstants::INITIAL_PROBABILITY);

    b_.resize(numBins_, IMCRAConstants::INITIAL_BIAS_FACTOR);
    Bmin_.resize(numBins_, IMCRAConstants::INITIAL_BIAS_FACTOR);
    lmin_flag_.resize(numBins_, 0);

    // Initialize sub-window minima tracking
    size_t numSubWindows = cfg_.windowLength / cfg_.subWindowLength;
    Smin_sw_.resize(numSubWindows);
    for (auto& sw : Smin_sw_) {
        sw.resize(numBins_, IMCRAConstants::INITIAL_MINIMUM_VALUE);
    }
    Smin_sw_idx_.resize(numBins_, 0);
}

IMCRA::~IMCRA() = default;

void IMCRA::reset() {
    frameCount_ = 0;
    subwc_ = 0;

    std::fill(S_.begin(), S_.end(), IMCRAConstants::ZERO_VALUE);
    std::fill(Smin_.begin(), Smin_.end(), IMCRAConstants::INITIAL_MINIMUM_VALUE);
    std::fill(Stmp_.begin(), Stmp_.end(), IMCRAConstants::INITIAL_MINIMUM_VALUE);
    std::fill(lambda_d_.begin(), lambda_d_.end(), IMCRAConstants::ZERO_VALUE);
    std::fill(xi_.begin(), xi_.end(), IMCRAConstants::INITIAL_SNR_VALUE);
    std::fill(gamma_.begin(), gamma_.end(), IMCRAConstants::INITIAL_SNR_VALUE);
    std::fill(GH1_.begin(), GH1_.end(), IMCRAConstants::INITIAL_GAIN);
    std::fill(q_.begin(), q_.end(), IMCRAConstants::INITIAL_PROBABILITY);
    std::fill(p_.begin(), p_.end(), IMCRAConstants::INITIAL_PROBABILITY);
    std::fill(b_.begin(), b_.end(), IMCRAConstants::INITIAL_BIAS_FACTOR);
    std::fill(Bmin_.begin(), Bmin_.end(), IMCRAConstants::INITIAL_BIAS_FACTOR);
    std::fill(lmin_flag_.begin(), lmin_flag_.end(), 0);

    for (auto& sw : Smin_sw_) {
        std::fill(sw.begin(), sw.end(), IMCRAConstants::INITIAL_MINIMUM_VALUE);
    }
    std::fill(Smin_sw_idx_.begin(), Smin_sw_idx_.end(), 0);
}

void IMCRA::setConfig(const Config& cfg) {
    cfg_ = cfg;
    reset();
}

void IMCRA::processFrame(const std::vector<float>& magnitudeSpectrum, std::vector<float>& noiseSpectrum,
                         std::vector<float>& speechProbability) {
    if (magnitudeSpectrum.size() != numBins_) {
        throw std::invalid_argument("Magnitude spectrum size mismatch");
    }

    // Ensure output vectors are properly sized
    noiseSpectrum.resize(numBins_);
    speechProbability.resize(numBins_);

    // Update minimum statistics
    updateMinimumStatistics(magnitudeSpectrum);

    // Update a priori and a posteriori SNR
    updateAPrioriSNR(magnitudeSpectrum);

    // Update speech presence probability
    updateSpeechPresenceProbability();

    // Update noise spectrum estimate using IMCRA rule
    for (size_t k = 0; k < numBins_; ++k) {
        float Y2 = magnitudeSpectrum[k] * magnitudeSpectrum[k];

        // IMCRA noise update rule with speech presence probability
        float alpha_d_tilde = cfg_.alphaD + (IMCRAConstants::UNITY_VALUE - cfg_.alphaD) * p_[k];

        // Update noise PSD estimate
        lambda_d_[k] = alpha_d_tilde * lambda_d_[k] + (IMCRAConstants::UNITY_VALUE - alpha_d_tilde) * Y2;

        // Apply bias correction
        lambda_d_[k] = b_[k] * lambda_d_[k];

        // Output results
        noiseSpectrum[k] = std::sqrt(lambda_d_[k]);
        speechProbability[k] = p_[k];
    }

    frameCount_++;
}

void IMCRA::updateMinimumStatistics(const std::vector<float>& magnitude) {
    // Smooth power spectrum
    for (size_t k = 0; k < numBins_; ++k) {
        float Y2 = magnitude[k] * magnitude[k];

        if (frameCount_ == 0) {
            S_[k] = Y2;
            Smin_[k] = Y2;
            Stmp_[k] = Y2;
            lambda_d_[k] = Y2;
        } else {
            S_[k] = cfg_.alphaS * S_[k] + (IMCRAConstants::UNITY_VALUE - cfg_.alphaS) * Y2;
        }
    }

    // Update minimum tracking every subWindowLength frames
    if (frameCount_ % cfg_.subWindowLength == 0) {
        size_t sw_idx = subwc_ % Smin_sw_.size();

        for (size_t k = 0; k < numBins_; ++k) {
            // Store current minimum in sub-window buffer
            Smin_sw_[sw_idx][k] = Stmp_[k];
            Stmp_[k] = S_[k]; // Reset temporary minimum

            // Find minimum across all sub-windows
            float min_val = IMCRAConstants::INITIAL_MINIMUM_VALUE;
            for (const auto& sw : Smin_sw_) {
                if (sw[k] < min_val) {
                    min_val = sw[k];
                }
            }

            // Update global minimum with bias compensation
            if (min_val < Smin_[k]) {
                Smin_[k] = min_val;
                lmin_flag_[k] = 0; // Reset flag when minimum is updated
            } else {
                lmin_flag_[k]++;
            }

            // Bias correction factor based on how long since last minimum update
            if (lmin_flag_[k] > 0) {
                float gamma_inv =
                    IMCRAConstants::UNITY_VALUE /
                    (IMCRAConstants::UNITY_VALUE + (lmin_flag_[k] - 1) * IMCRAConstants::BIAS_CORRECTION_STEP);
                b_[k] = IMCRAConstants::UNITY_VALUE +
                        (IMCRAConstants::UNITY_VALUE - gamma_inv) * IMCRAConstants::BIAS_CORRECTION_FACTOR;
            } else {
                b_[k] = IMCRAConstants::UNITY_VALUE;
            }

            // Ensure bias factor doesn't exceed maximum
            b_[k] = min(b_[k], IMCRAConstants::UNITY_VALUE / cfg_.betaMax);
        }

        subwc_++;
    } else {
        // Update temporary minimum within sub-window
        for (size_t k = 0; k < numBins_; ++k) {
            if (S_[k] < Stmp_[k]) {
                Stmp_[k] = S_[k];
            }
        }
    }
}

void IMCRA::updateAPrioriSNR(const std::vector<float>& magnitude) {
    float xiOpt = std::pow(IMCRAConstants::DB_TO_LINEAR_FACTOR, cfg_.xiOptDb / IMCRAConstants::DB_TO_LINEAR_DIVISOR);

    for (size_t k = 0; k < numBins_; ++k) {
        float Y2 = magnitude[k] * magnitude[k];

        // A posteriori SNR
        gamma_[k] = Y2 / max(lambda_d_[k], IMCRAConstants::MIN_SNR_PROTECTION);

        // Decision-directed a priori SNR estimation
        float xiDD = cfg_.alphaD2 * GH1_[k] * GH1_[k] * gamma_[k];

        // Constraint on a priori SNR
        float xiML = max(gamma_[k] - IMCRAConstants::UNITY_VALUE, IMCRAConstants::ZERO_VALUE);
        xi_[k] = xiDD + (IMCRAConstants::UNITY_VALUE - cfg_.alphaD2) * xiML;

        // Apply minimum constraint
        xi_[k] = max(xi_[k], cfg_.xiMin);

        // Compute gain function for next iteration (Wiener filter)
        GH1_[k] = xi_[k] / (IMCRAConstants::UNITY_VALUE + xi_[k]);

        // Apply minimum gain constraint
        GH1_[k] = max(GH1_[k], cfg_.gMin);
    }
}

void IMCRA::updateSpeechPresenceProbability() {
    for (size_t k = 0; k < numBins_; ++k) {
        // Local a posteriori SNR for speech presence detection
        float gamma_min = S_[k] / (Bmin_[k] * Smin_[k]);
        float xi_local = IMCRAConstants::ZERO_VALUE;

        // Compute local a priori SNR
        if (gamma_min > IMCRAConstants::UNITY_VALUE) {
            xi_local = (gamma_min - IMCRAConstants::UNITY_VALUE);
        }

        // Speech presence likelihood ratio
        float log_xi_gamma = xi_local * gamma_min / (IMCRAConstants::UNITY_VALUE + xi_local);
        float likelihood_ratio = std::exp(min(log_xi_gamma, IMCRAConstants::MAX_LIKELIHOOD_RATIO));

        // Update speech absence probability with constraints
        float q_tmp = IMCRAConstants::UNITY_VALUE / (IMCRAConstants::UNITY_VALUE + likelihood_ratio);
        q_[k] = clamp(q_tmp, cfg_.qMin, cfg_.qMax);

        // Convert to speech presence probability
        p_[k] = IMCRAConstants::UNITY_VALUE - q_[k];

        // Additional decision based on global SNR criteria
        if (gamma_[k] > cfg_.gamma0 && xi_[k] > cfg_.zeta0) {
            p_[k] = IMCRAConstants::UNITY_VALUE; // Strong speech presence
        } else if (gamma_[k] < cfg_.gamma1) {
            p_[k] = IMCRAConstants::ZERO_VALUE; // Strong noise presence
        }
    }
}

float IMCRA::computeSpeechProbability(float gammak, float xik) {
    // Compute speech presence probability based on generalized likelihood ratio
    float vk = xik * gammak / (IMCRAConstants::UNITY_VALUE + xik);
    float lambda = std::exp(-vk);

    // Compute exponential integral E1(vk) using approximation
    float ei = MathUtils::expint(vk);

    // Speech presence probability
    float pk = lambda * (IMCRAConstants::UNITY_VALUE + vk) * ei;

    return clamp(pk, IMCRAConstants::ZERO_VALUE, IMCRAConstants::UNITY_VALUE);
}

} // namespace AudioNR
