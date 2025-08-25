Pod::Spec.new do |s|
  s.name             = 'AudioModule'
  s.version          = '1.0.0'
  s.summary          = 'Module natif iOS pour la capture audio, compatible TurboModule'
  s.description      = <<-DESC
    AudioModule est un module natif iOS pour l'enregistrement audio haute qualité.
    Il utilise AVAudioEngine et AVAudioSession pour une intégration système optimale.
    Le module est conçu pour être facilement intégré dans un TurboModule React Native.
  DESC

  s.homepage         = 'https://github.com/your-org/audio-module'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'Your Name' => 'your-email@example.com' }
  s.source           = { :git => 'https://github.com/your-org/audio-module.git', :tag => s.version.to_s }

  s.ios.deployment_target = '13.0'
  s.swift_version = '5.0'

  s.source_files = 'AudioModule/**/*.swift'
  
  s.frameworks = 'AVFoundation', 'Foundation'
  
  # Si intégration avec React Native
  # s.dependency 'React-Core'
  
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_OPTIMIZATION_LEVEL' => '-O',
    'SWIFT_VERSION' => '5.0'
  }

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'AudioModuleTests/**/*.swift'
  end
end