#pragma once

// ========================================================
// PCH ultra-minimal pour iOS - Évite TOUS les conflits
// Version finale sans algorithm/atomic/chrono
// ========================================================

#ifdef __OBJC__
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#endif

#ifdef __cplusplus

// Définitions POSIX complètes pour éviter les conflits nanosleep
#ifndef _POSIX_C_SOURCE
#define _POSIX_C_SOURCE 200809L
#endif
#ifndef _DARWIN_C_SOURCE
#define _DARWIN_C_SOURCE 1
#endif
#ifndef _GNU_SOURCE
#define _GNU_SOURCE 1
#endif

// Inclure nanosleep avant les en-têtes C++
#include <sys/types.h>
#include <time.h>
#include <unistd.h>

// Types de base C++ uniquement (aucun conteneur STL)
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <cmath>

// Gestion d'erreurs minimale
#include <stdexcept>
#include <exception>
#include <cassert>

// Pas d'algorithm, utility, array, memory - ils causent des conflits
// Les fichiers individuels incluront ces en-têtes si nécessaire

#endif // __cplusplus
