#include <iostream>
#include <string>
#include <vector>
#include <tuple>
#include <type_traits>
#include <optional>  // C++17 feature
#include <string_view>  // C++17 feature

// C++17: Structured bindings
auto get_person_info() {
    return std::make_tuple("John", 25, "Engineer");
}

// C++17: if constexpr
template<typename T>
auto print_type_info(const T& value) {
    if constexpr (std::is_integral_v<T>) {
        std::cout << "Integer: " << value << std::endl;
    } else if constexpr (std::is_floating_point_v<T>) {
        std::cout << "Float: " << value << std::endl;
    } else {
        std::cout << "Other: " << value << std::endl;
    }
}

// C++17: std::optional
std::optional<std::string> find_user(int id) {
    if (id == 1) {
        return "Alice";
    }
    return std::nullopt;
}

// C++17: std::string_view
void process_string(std::string_view sv) {
    std::cout << "Processing: " << sv << " (length: " << sv.length() << ")" << std::endl;
}

int main() {
    std::cout << "=== C++17 Features Test ===" << std::endl;

    // Structured bindings
    auto [name, age, job] = get_person_info();
    std::cout << "Person: " << name << ", " << age << ", " << job << std::endl;

    // if constexpr
    print_type_info(42);
    print_type_info(3.14);
    print_type_info("Hello");

    // std::optional
    if (auto user = find_user(1); user.has_value()) {
        std::cout << "Found user: " << *user << std::endl;
    } else {
        std::cout << "User not found" << std::endl;
    }

    // std::string_view
    std::string_view sv = "Hello World";
    process_string(sv);

    // C++17: Class template argument deduction
    std::vector numbers{1, 2, 3, 4, 5};

    std::cout << "Numbers: ";
    for (const auto& num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    return 0;
}
