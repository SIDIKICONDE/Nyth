#pragma once

#include <string>

#if defined(__has_include)
#  if __has_include(<version>)
#    include <version>
#  endif
#endif

#if defined(__has_include) && __has_include(<format>) && defined(__cpp_lib_format)
#  include <format>
namespace nyth {
    template <class... Args>
    inline std::string format(std::string_view fmt, const Args&... args) {
        return std::vformat(fmt, std::make_format_args(args...));
    }
}
#else
#  include <sstream>
#  include <utility>
namespace nyth {
    template <class... Args>
    inline std::string format(const std::string& fmt, Args&&... args) {
        std::ostringstream oss;
        oss << fmt;
        using expander = int[];
        (void)expander{0, ((void)(oss << ' ' << std::forward<Args>(args)), 0)...};
        return oss.str();
    }
}
#endif


