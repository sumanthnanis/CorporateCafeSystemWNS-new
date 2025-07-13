import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Coffee,
  ArrowLeft,
  Eye,
  EyeOff,
  ChefHat,
  Users,
  Sparkles,
} from "lucide-react";

const Auth = () => {
  const [userType, setUserType] = useState("EMPLOYEE");
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    full_name: "",
  });

  const { login, register } = useAuth();
  const { theme: globalTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const user = await login({
          username: formData.username,
          password: formData.password,
        });

        if (user.user_type !== userType) {
          toast({
            title: "Access Denied",
            description: `This account is registered as ${user.user_type.toLowerCase().replace("_", " ")}. Please select the correct user type.`,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Welcome back!",
          description: `You have successfully logged in as ${userType.toLowerCase().replace("_", " ")}.`,
        });

        // Navigate based on user type
        if (userType === "EMPLOYEE") {
          navigate("/employee");
        } else if (userType === "CAFE_OWNER") {
          navigate("/owner");
        } else if (userType === "SUPER_ADMIN") {
          navigate("/admin");
        }
      } else {
        // Register
        const newUser = await register({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          full_name: formData.full_name,
          user_type: userType,
        });

        // Auto login after successful registration
        const loginUser = await login({
          username: formData.username,
          password: formData.password,
        });

        toast({
          title: "Welcome!",
          description:
            "Your account has been created and you're now logged in.",
        });

        // Navigate based on user type
        if (userType === "EMPLOYEE") {
          navigate("/employee");
        } else if (userType === "CAFE_OWNER") {
          navigate("/owner");
        } else if (userType === "SUPER_ADMIN") {
          navigate("/admin");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);

      // Handle specific login errors
      let errorMessage = "An error occurred. Please try again.";
      let errorTitle = "Error";

      if (error.response?.status === 401) {
        errorTitle = "Login Failed";
        errorMessage =
          "Incorrect username or password. Please check your credentials and try again.";
      } else if (error.response?.status === 422) {
        errorTitle = "Invalid Input";
        errorMessage =
          error.response?.data?.detail ||
          "Please check your input and try again.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getThemeClasses = () => {
    const isDark = globalTheme === "dark";

    if (userType === "EMPLOYEE") {
      return {
        background: isDark
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-white",
        card: "food-card food-card-employee",
        primary: "text-employee-primary",
        button: "food-button food-button-employee bg-green-600 hover:bg-green-700 text-white",
        toggle: isDark
          ? "bg-gray-700 border-gray-600"
          : "bg-employee-primary/10 border-employee-primary/20",
        activeToggle: "bg-employee-primary text-white",
        icon: "text-employee-primary",
      };
    } else if (userType === "CAFE_OWNER") {
      return {
        background: isDark
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-white",
        card: "food-card food-card-owner",
        primary: "text-owner-primary",
        button: "food-button food-button-owner bg-red-600 hover:bg-red-700 text-white",
        toggle: isDark
          ? "bg-gray-700 border-gray-600"
          : "bg-owner-primary/10 border-owner-primary/20",
        activeToggle: "bg-owner-primary text-white",
        icon: "text-owner-primary",
      };
    } else {
      // SUPER_ADMIN
      return {
        background: isDark
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-white",
        card: "food-card",
        primary: "text-blue-600",
        button: "food-button bg-blue-600 hover:bg-blue-700",
        toggle: isDark
          ? "bg-gray-700 border-gray-600"
          : "bg-blue-100 border-blue-200",
        activeToggle: "bg-blue-600 text-white",
        icon: "text-blue-600",
      };
    }
  };

  const theme = getThemeClasses();

  return (
    <div
      className={`flex items-center justify-center min-h-screen ${theme.background} transition-all duration-500`}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className={`inline-flex items-center ${theme.primary} hover:opacity-80 mb-8 transition-opacity`}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        {/* Main Auth Card */}
        <div className="max-w-lg mx-auto p-4 sm:max-w-lg">
          <Card
            className={`${theme.card} ${
              userType === "EMPLOYEE"
                ? globalTheme === "dark"
                  ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-sm"
                  : "bg-green-50" // Light green for employee
                : userType === "CAFE_OWNER"
                  ? globalTheme === "dark"
                    ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-sm"
                    : "bg-red-50" // Light red for cafe owner
                  : userType === "SUPER_ADMIN"
                    ? globalTheme === "dark"
                      ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-sm"
                      : "bg-blue-50" // Light blue for super admin
                    : ""
            } rounded-xl shadow-lg border border-gray-200/50`}
          >
            <CardHeader className="text-center space-y-6">
              {/* Brand Header */}
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 shadow-lg">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
              </div>

              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                  {isLogin ? "Welcome Back!" : "Join FoodFlow"}
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-2">
                  {isLogin
                    ? "Sign in to your account"
                    : "Create your account to get started"}
                </CardDescription>
              </div>

              {/* User Type Toggle */}
              <div
                className={`p-1 rounded-lg ${theme.toggle} grid grid-cols-3 gap-1`}
              >
                <button
                  type="button"
                  onClick={() => setUserType("EMPLOYEE")}
                  className={`py-2 px-3 rounded-md transition-all duration-200 flex items-center justify-center space-x-1 ${
                    userType === "EMPLOYEE"
                      ? "bg-employee-primary text-white shadow-md"
                      : globalTheme === "dark"
                        ? "text-gray-300 hover:text-employee-primary "
                        : "text-gray-600 hover:text-employee-primary b"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-sm">Employee</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("CAFE_OWNER")}
                  className={`py-2 px-3 rounded-md transition-all duration-200 flex items-center justify-center space-x-1 ${
                    userType === "CAFE_OWNER"
                      ? "bg-owner-primary text-white shadow-md"
                      : globalTheme === "dark"
                        ? "text-gray-300 hover:text-owner-primary"
                        : "text-gray-600 hover:text-owner-primary"
                  }`}
                >
                  <ChefHat className="h-4 w-4" />
                  <span className="font-medium text-sm">Cafe Owner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("SUPER_ADMIN")}
                  className={`py-2 px-3 rounded-md transition-all duration-200 flex items-center justify-center space-x-1 ${
                    userType === "SUPER_ADMIN"
                      ? "bg-blue-600 text-white shadow-md"
                      : globalTheme === "dark"
                        ? "text-gray-300 hover:text-blue-600"
                        : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  <Coffee className="h-4 w-4" />
                  <span className="font-medium text-sm">Super Admin</span>
                </button>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Registration Fields */}
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="full_name"
                        className="text-gray-700 font-medium"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        className="h-12 border-gray-200 focus:border-brand-400 focus:ring-brand-400/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-gray-700 font-medium"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="h-12 border-gray-200 focus:border-brand-400 focus:ring-brand-400/20"
                      />
                    </div>
                  </>
                )}

                {/* Common Fields */}
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-gray-700 font-medium"
                  >
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="h-12 border-gray-200 focus:border-brand-400 focus:ring-brand-400/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-gray-700 font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="h-12 border-gray-200 focus:border-brand-400 focus:ring-brand-400/20 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className={`w-full h-12 ${theme.button} font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200`}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Please wait...</span>
                    </div>
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {/* Toggle Login/Register */}
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className={`${theme.primary} hover:opacity-80 font-medium transition-opacity`}
                  >
                    {isLogin
                      ? "Don't have an account? Create one here"
                      : "Already have an account? Sign in here"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
