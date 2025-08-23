import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import UserNotifications
import FirebaseMessaging
import GoogleSignIn

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Configuration Firebase AVANT l'initialisation de React Native
    do {
      FirebaseApp.configure()
      print("✅ Firebase configuré avec succès")
    } catch {
      print("❌ Erreur lors de la configuration Firebase: \(error)")
    }

    // Notifications iOS
    UNUserNotificationCenter.current().delegate = self
    DispatchQueue.main.async {
      application.registerForRemoteNotifications()
    }
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Nyth",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // URL handler for Google Sign-In and other deep links
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    // Handle Google Sign-In
    if GIDSignIn.sharedInstance.handle(url) {
      return true
    }
    
    // Handle other URL schemes (including Apple Sign-In callbacks)
    // This will allow React Native to handle the URL
    if let delegate = reactNativeDelegate {
      return delegate.application(app, open: url, options: options)
    }
    
    return false
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
  
  func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any]) -> Bool {
    // Handle React Native deep links
    // Note: RCTLinkingManager might not be available in this context
    // For now, return false to avoid compilation errors
    return false
  }
}

// MARK: - Notifications (UNUserNotificationCenterDelegate)
extension AppDelegate {
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    // Mapper le token APNs vers Firebase Messaging pour FCM
    Messaging.messaging().apnsToken = deviceToken
  }

  @available(iOS 10.0, *)
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    // Afficher les notifications en foreground
    if #available(iOS 14.0, *) {
      completionHandler([.banner, .list, .sound, .badge])
    } else {
      completionHandler([.alert, .sound, .badge])
    }
  }

  @available(iOS 10.0, *)
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              didReceive response: UNNotificationResponse,
                              withCompletionHandler completionHandler: @escaping () -> Void) {
    completionHandler()
  }
}
