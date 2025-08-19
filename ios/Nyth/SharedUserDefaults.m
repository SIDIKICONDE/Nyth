//
//  SharedUserDefaults.m
//  Nyth
//
//  Bridge Objective-C pour exposer SharedUserDefaults à React Native
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SharedUserDefaults, NSObject)

// String operations
RCT_EXTERN_METHOD(setString:(NSString *)key
                  value:(NSString *)value
                  suiteName:(NSString *)suiteName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getString:(NSString *)key
                  suiteName:(NSString *)suiteName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Remove operations
RCT_EXTERN_METHOD(removeKey:(NSString *)key
                  suiteName:(NSString *)suiteName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Widget operations
RCT_EXTERN_METHOD(reloadWidget:(NSString *)widgetKind
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(reloadAllWidgets:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end