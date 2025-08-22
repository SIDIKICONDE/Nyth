#pragma once

// ========================================================
// PCH simplifié pour iOS - Version minimale
// ========================================================

#ifdef __OBJC__
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#endif

#ifdef __cplusplus

// Définitions POSIX minimales
#ifndef _POSIX_C_SOURCE
#define _POSIX_C_SOURCE 200809L
#endif

// En-têtes C de base
#include <sys/types.h>
#include <time.h>
#include <unistd.h>

// Wrappers C++ de base
#include <ctime>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <cmath>

// Conteneurs de base
#include <array>
#include <memory>

// Utilitaires de base
#include <algorithm>
#include <utility>

// Chrono pour C++20
#include <time.h>

// Concurrence de base
#include <thread>
#include <mutex>
#include <atomic>

// I/O de base
#include <iostream>

// Gestion d'erreurs de base
#include <stdexcept>
#include <exception>
#include <cassert>

#endif
