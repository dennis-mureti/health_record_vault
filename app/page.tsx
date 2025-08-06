import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, Database, Lock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Health Records Vault</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Secure, encrypted, and role-based access to medical records with comprehensive audit trails
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle>Secure Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Multi-factor authentication and encrypted data storage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Role-Based</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Different access levels for doctors, nurses, and pharmacists</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Database className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle>Normalized DB</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">3NF database design with proper relationships</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Lock className="h-12 w-12 text-red-600 mx-auto mb-2" />
              <CardTitle>Data Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Sensitive, confidential, and public data separation</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/login">
            <Button size="lg" className="mr-4">
              Login to System
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              View Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle>Access Control Matrix</CardTitle>
              <CardDescription>User permissions by role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">User Type</th>
                      <th className="border border-gray-300 p-2">Select</th>
                      <th className="border border-gray-300 p-2">Insert</th>
                      <th className="border border-gray-300 p-2">Update</th>
                      <th className="border border-gray-300 p-2">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">Doctor</td>
                      <td className="border border-gray-300 p-2 text-center">✅ All Records</td>
                      <td className="border border-gray-300 p-2 text-center">✅ Medical Records</td>
                      <td className="border border-gray-300 p-2 text-center">✅ Own Records</td>
                      <td className="border border-gray-300 p-2 text-center">❌ None</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">Pharmacist</td>
                      <td className="border border-gray-300 p-2 text-center">✅ Prescriptions</td>
                      <td className="border border-gray-300 p-2 text-center">❌ None</td>
                      <td className="border border-gray-300 p-2 text-center">✅ Prescription Status</td>
                      <td className="border border-gray-300 p-2 text-center">❌ None</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">Nurse</td>
                      <td className="border border-gray-300 p-2 text-center">✅ Non-sensitive</td>
                      <td className="border border-gray-300 p-2 text-center">✅ Appointments</td>
                      <td className="border border-gray-300 p-2 text-center">✅ Patient Info</td>
                      <td className="border border-gray-300 p-2 text-center">❌ None</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">Patient</td>
                      <td className="border border-gray-300 p-2 text-center">✅ Own Records</td>
                      <td className="border border-gray-300 p-2 text-center">❌ None</td>
                      <td className="border border-gray-300 p-2 text-center">✅ Own Info</td>
                      <td className="border border-gray-300 p-2 text-center">❌ None</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
