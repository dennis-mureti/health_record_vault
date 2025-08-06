"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  Pill,
  Calendar,
  Shield,
  Database,
  UserCheck,
  Activity,
} from "lucide-react";

interface ModuleAccess {
  userType: string;
  modules: Array<{
    id: string;
    name: string;
    description: string;
    icon: any;
    accessible: boolean;
    route: string;
  }>;
}

export default function ModulesPage() {
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    console.log(
      "[DEBUG] modules page: userType from localStorage:",
      localStorage.getItem("userType")
    );
    if (!userType || userType === "undefined") {
      router.push("/login");
      return;
    }

    setModuleAccess(getModuleAccess(userType));
    setLoading(false);
  }, [router]);

  const getModuleAccess = (userType: string): ModuleAccess => {
    const allModules = [
      {
        id: "patients",
        name: "Patient Management",
        description: "Manage patient records and information",
        icon: Users,
        route: "/modules/patients",
      },
      {
        id: "medical_records",
        name: "Medical Records",
        description: "Access and manage medical records",
        icon: FileText,
        route: "/modules/medical-records",
      },
      {
        id: "prescriptions",
        name: "Prescriptions",
        description: "Manage medication prescriptions",
        icon: Pill,
        route: "/modules/prescriptions",
      },
      {
        id: "appointments",
        name: "Appointments",
        description: "Schedule and manage appointments",
        icon: Calendar,
        route: "/modules/appointments",
      },
      {
        id: "sensitive_records",
        name: "Sensitive Records",
        description: "Access sensitive medical information",
        icon: Shield,
        route: "/modules/sensitive-records",
      },
      {
        id: "data_management",
        name: "Data Management",
        description: "Insert and retrieve encrypted data",
        icon: Database,
        route: "/modules/data-management",
      },
      {
        id: "database_viewer",
        name: "Database Viewer",
        description: "View all database tables and security implementation",
        icon: Database,
        route: "/modules/database-viewer",
      },
      {
        id: "user_management",
        name: "User Management",
        description: "Manage system users and permissions",
        icon: UserCheck,
        route: "/modules/user-management",
      },
      {
        id: "audit_logs",
        name: "Audit Logs",
        description: "View system access and activity logs",
        icon: Activity,
        route: "/modules/audit-logs",
      },
    ];

    // Define access control based on user type
    const accessControl: Record<string, string[]> = {
      doctor: [
        "patients",
        "medical_records",
        "prescriptions",
        "appointments",
        "sensitive_records",
        "data_management",
        "database_viewer",
        "audit_logs",
      ],
      pharmacist: ["prescriptions", "data_management"],
      nurse: ["patients", "medical_records", "appointments", "data_management"],
      patient: ["medical_records", "prescriptions", "appointments"],
      admin: [
        "patients",
        "medical_records",
        "prescriptions",
        "appointments",
        "sensitive_records",
        "data_management",
        "database_viewer",
        "user_management",
        "audit_logs",
      ],
    };

    const userModules = allModules.map((module) => ({
      ...module,
      accessible: accessControl[userType]?.includes(module.id) || false,
    }));

    return {
      userType,
      modules: userModules,
    };
  };

  const handleModuleClick = (module: any) => {
    if (module.accessible) {
      router.push(module.route);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                System Modules
              </h1>
              <p className="text-gray-600">
                Access modules based on your role:{" "}
                <Badge variant="secondary">{moduleAccess?.userType}</Badge>
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {moduleAccess?.modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Card
                key={module.id}
                className={`cursor-pointer transition-all duration-200 ${
                  module.accessible
                    ? "hover:shadow-lg hover:scale-105 border-blue-200"
                    : "opacity-50 cursor-not-allowed bg-gray-100"
                }`}
                onClick={() => handleModuleClick(module)}
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <IconComponent
                      className={`h-12 w-12 ${
                        module.accessible ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <CardTitle
                    className={`text-lg ${
                      module.accessible ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {module.name}
                  </CardTitle>
                  <div className="flex justify-center">
                    <Badge
                      variant={module.accessible ? "default" : "secondary"}
                      className={
                        module.accessible
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {module.accessible ? "Accessible" : "Restricted"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {module.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Access Control Matrix</CardTitle>
              <CardDescription>
                Module access permissions by user role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">
                        Module
                      </th>
                      <th className="border border-gray-300 p-2">Doctor</th>
                      <th className="border border-gray-300 p-2">Pharmacist</th>
                      <th className="border border-gray-300 p-2">Nurse</th>
                      <th className="border border-gray-300 p-2">Patient</th>
                      <th className="border border-gray-300 p-2">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moduleAccess?.modules.map((module) => (
                      <tr key={module.id}>
                        <td className="border border-gray-300 p-2 font-medium">
                          {module.name}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {[
                            "patients",
                            "medical_records",
                            "prescriptions",
                            "appointments",
                            "sensitive_records",
                            "data_management",
                            "database_viewer",
                            "audit_logs",
                          ].includes(module.id)
                            ? "✅"
                            : "❌"}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {["prescriptions", "data_management"].includes(
                            module.id
                          )
                            ? "✅"
                            : "❌"}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {[
                            "patients",
                            "medical_records",
                            "appointments",
                            "data_management",
                          ].includes(module.id)
                            ? "✅"
                            : "❌"}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {[
                            "medical_records",
                            "prescriptions",
                            "appointments",
                          ].includes(module.id)
                            ? "✅"
                            : "❌"}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          ✅
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
