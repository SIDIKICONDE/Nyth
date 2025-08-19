//
//  SharedUserDefaults.swift
//  Nyth
//
//  Module natif pour gérer les UserDefaults partagés avec le widget
//

import Foundation
import React
import WidgetKit

@objc(SharedUserDefaults)
class SharedUserDefaults: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  // MARK: - String Operations
  
  @objc
  func setString(_ key: String, value: String, suiteName: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = UserDefaults(suiteName: suiteName) else {
      rejecter("SUITE_ERROR", "Impossible de créer UserDefaults avec le suite: \(suiteName)", nil)
      return
    }
    
    userDefaults.set(value, forKey: key)
    userDefaults.synchronize()
    resolver(true)
  }
  
  @objc
  func getString(_ key: String, suiteName: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = UserDefaults(suiteName: suiteName) else {
      rejecter("SUITE_ERROR", "Impossible de créer UserDefaults avec le suite: \(suiteName)", nil)
      return
    }
    
    let value = userDefaults.string(forKey: key)
    resolver(value)
  }
  
  // MARK: - Remove Operations
  
  @objc
  func removeKey(_ key: String, suiteName: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = UserDefaults(suiteName: suiteName) else {
      rejecter("SUITE_ERROR", "Impossible de créer UserDefaults avec le suite: \(suiteName)", nil)
      return
    }
    
    userDefaults.removeObject(forKey: key)
    userDefaults.synchronize()
    resolver(true)
  }
  
  // MARK: - Widget Operations
  
  @objc
  func reloadWidget(_ widgetKind: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
      resolver(true)
    } else {
      rejecter("VERSION_ERROR", "Les widgets nécessitent iOS 14.0 ou supérieur", nil)
    }
  }
  
  @objc
  func reloadAllWidgets(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
      resolver(true)
    } else {
      rejecter("VERSION_ERROR", "Les widgets nécessitent iOS 14.0 ou supérieur", nil)
    }
  }
}