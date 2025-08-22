#pragma once

// C++17 compatibility header for string formatting
#include <string>
#include <sstream>
#include <iomanip>

namespace compat {

// Simple format function for C++17 (before std::format in C++20)
template<typename... Args>
std::string format(const std::string& format_str, Args... args) {
    std::ostringstream oss;
    // Simple implementation - just concatenate for now
    // In a real implementation, you'd parse format_str
    oss << format_str;
    return oss.str();
}

// Helper for formatting with precision
inline std::string format_float(float value, int precision = 2) {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(precision) << value;
    return oss.str();
}

inline std::string format_double(double value, int precision = 2) {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(precision) << value;
    return oss.str();
}

} // namespace compat