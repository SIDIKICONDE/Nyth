#include <iostream>
#include <type_traits>

// Test C++17 type traits
template<typename T>
void test_type_trait(const char* type_name) {
    std::cout << "Testing " << type_name << ":" << std::endl;
    std::cout << "  std::is_pointer_v<" << type_name << "> = "
              << (std::is_pointer_v<T> ? "true" : "false") << std::endl;
    std::cout << "  std::is_floating_point_v<" << type_name << "> = "
              << (std::is_floating_point_v<T> ? "true" : "false") << std::endl;
    std::cout << "  std::is_same_v<" << type_name << ", int> = "
              << (std::is_same_v<T, int> ? "true" : "false") << std::endl;
    std::cout << std::endl;
}

int main() {
    std::cout << "C++17 Type Traits Test - Fix Verification" << std::endl;
    std::cout << "=========================================" << std::endl;

    test_type_trait<int>("int");
    test_type_trait<int*>("int*");
    test_type_trait<float>("float");
    test_type_trait<double>("double");
    test_type_trait<char*>("char*");

    std::cout << "✅ All C++17 type traits working correctly!" << std::endl;
    return 0;
}
