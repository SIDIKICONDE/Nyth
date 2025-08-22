#pragma once

// Précompilé commun C++/ObjC++

#ifdef __OBJC__
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#endif

#ifdef __cplusplus
#if defined(__has_include)
#  if __has_include(<atomic>)
#    include <atomic>
#  endif
#  if __has_include(<vector>)
#    include <vector>
#  endif
#  if __has_include(<array>)
#    include <array>
#  endif
#  if __has_include(<string>)
#    include <string>
#  endif
#  if __has_include(<memory>)
#    include <memory>
#  endif
#  if __has_include(<mutex>)
#    include <mutex>
#  endif
#  if __has_include(<optional>)
#    include <optional>
#  endif
#  if __has_include(<span>)
#    include <span>
#  endif
#  if __has_include(<algorithm>)
#    include <algorithm>
#  endif
#  if __has_include(<numeric>)
#    include <numeric>
#  endif
#  if __has_include(<cmath>)
#    include <cmath>
#  endif
#  if __has_include(<cstdint>)
#    include <cstdint>
#  endif
#  if __has_include(<limits>)
#    include <limits>
#  endif
#  if __has_include(<cstddef>)
#    include <cstddef>
#  endif
#  if __has_include(<cstring>)
#    include <cstring>
#  endif
#else
#  include <atomic>
#  include <vector>
#  include <array>
#  include <string>
#  include <memory>
#  include <mutex>
#  include <optional>
#  include <span>
#  include <algorithm>
#  include <numeric>
#  include <cmath>
#  include <cstdint>
#  include <limits>
#  include <cstddef>
#  include <cstring>
#endif
#endif

#ifndef __cplusplus
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <math.h>
#endif
