"use client";
import type React from "react";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Database, Lock, Eye, Plus, Search } from "lucide-react";

interface MedicalRecordData {
  recordType: string;
  title: string;
  description: string;
  diagnosisCode?: string;
  isSensitive: boolean;
}

interface InsertDataState {
  dataType: string;
  patientId: string;
  data: MedicalRecordData;
}

interface RetrieveDataState {
  dataType: string;
  patientId: string;
  results: any;
}

export default function DataManagementPage() {
  const [userType, setUserType] = useState("");
  const [insertData, setInsertData] = useState<InsertDataState>({
    dataType: "",
    patientId: "",
    data: {
      recordType: "diagnosis",
      title: "",
      description: "",
      isSensitive: false,
    },
  });
  const [retrieveData, setRetrieveData] = useState<RetrieveDataState>({
    dataType: "",
    patientId: "",
    results: null,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUserType = localStorage.getItem("userType");
    setUserType(storedUserType || "");
  }, []);

  const handleInsertData = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("❌ No authentication token found. Please log in again.");
        return;
      }

      // Validate required fields
      if (!insertData.patientId || !insertData.data.title) {
        setMessage(
          "❌ Please fill in all required fields (Patient ID and Title)"
        );
        setLoading(false);
        return;
      }

      // Prepare the request data with all required fields
      const requestData = {
        patient_id: parseInt(insertData.patientId) || null,
        record_type: insertData.data.recordType || "diagnosis",
        title: insertData.data.title,
        description: insertData.data.description || "",
        diagnosis_code: insertData.data.diagnosisCode || "",
        is_sensitive: insertData.data.isSensitive || false,
        record_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
      };

      console.log("Sending request with data:", requestData);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/records`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      const result = await response.json();
      console.log(
        "Response status:",
        response.status,
        "Response data:",
        result
      );

      if (response.ok) {
        setMessage(`✅ ${result.message || "Record created successfully"}`);
        setInsertData({
          dataType: "",
          patientId: "",
          data: {
            recordType: "diagnosis",
            title: "",
            description: "",
            isSensitive: false,
          },
        });
      } else {
        setMessage(`❌ ${result.error || "Failed to create record"}`);
      }
    } catch (error) {
      console.error("Error in handleInsertData:", error);
      setMessage("❌ An error occurred while creating the record");
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieveData = async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (retrieveData.dataType) params.append("type", retrieveData.dataType);
      if (retrieveData.patientId)
        params.append("patientId", retrieveData.patientId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/records?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setRetrieveData((prev) => ({
          ...prev,
          results: result,
        }));
        setMessage("✅ Data retrieved successfully");
      } else {
        setMessage(`❌ ${result.error || "Failed to retrieve data"}`);
      }
    } catch (error) {
      setMessage("❌ Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderDataForm = () => {
    switch (insertData.dataType) {
      case "patient":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={(insertData.data as any).firstName || ""}
                  onChange={(e) =>
                    setInsertData((prev) => ({
                      ...prev,
                      data: { ...prev.data, firstName: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={(insertData.data as any).lastName || ""}
                  onChange={(e) =>
                    setInsertData((prev) => ({
                      ...prev,
                      data: { ...prev.data, lastName: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={(insertData.data as any).dateOfBirth || ""}
                onChange={(e) =>
                  setInsertData((prev) => ({
                    ...prev,
                    data: { ...prev.data, dateOfBirth: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={(insertData.data as any).gender || "Other"}
                onValueChange={(value) =>
                  setInsertData((prev) => ({
                    ...prev,
                    data: { ...prev.data, gender: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "medical_record":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="patientId">Patient ID</Label>
              <Input
                id="patientId"
                type="number"
                value={insertData.patientId}
                onChange={(e) =>
                  setInsertData((prev) => ({
                    ...prev,
                    patientId: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="recordType">Record Type</Label>
              <Select
                value={insertData.data.recordType || "diagnosis"}
                onValueChange={(value) =>
                  setInsertData((prev) => ({
                    ...prev,
                    data: { ...prev.data, recordType: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select record type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diagnosis">Diagnosis</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="lab_result">Lab Result</SelectItem>
                  <SelectItem value="mental_health">Mental Health</SelectItem>
                  <SelectItem value="genetic">Genetic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={insertData.data.title || ""}
                onChange={(e) =>
                  setInsertData((prev) => ({
                    ...prev,
                    data: { ...prev.data, title: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={insertData.data.description || ""}
                onChange={(e) =>
                  setInsertData((prev) => ({
                    ...prev,
                    data: { ...prev.data, description: e.target.value },
                  }))
                }
                placeholder="This will be encrypted if classified as sensitive..."
              />
            </div>
            <div>
              <Label htmlFor="diagnosisCode">Diagnosis Code</Label>
              <Input
                id="diagnosisCode"
                value={insertData.data.diagnosisCode || ""}
                onChange={(e) =>
                  setInsertData((prev) => ({
                    ...prev,
                    data: { ...prev.data, diagnosisCode: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="isSensitive">Is Sensitive</Label>
              <Select
                value={insertData.data.isSensitive ? "true" : "false"}
                onValueChange={(value) =>
                  setInsertData((prev) => ({
                    ...prev,
                    data: { ...prev.data, isSensitive: value === "true" },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sensitivity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return (
          <p className="text-gray-500">Select a data type to see the form</p>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Data Management
              </h1>
              <p className="text-gray-600">
                Insert and retrieve encrypted data - Role:{" "}
                <Badge variant="secondary">{userType}</Badge>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-600">AES-256 Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="insert" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="insert" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Insert Data</span>
            </TabsTrigger>
            <TabsTrigger
              value="retrieve"
              className="flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Retrieve Data</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insert">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Insert Encrypted Data</span>
                </CardTitle>
                <CardDescription>
                  Add new records with automatic encryption for sensitive
                  information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInsertData} className="space-y-6">
                  <div>
                    <Label htmlFor="dataType">Data Type</Label>
                    <Select
                      value={insertData.dataType}
                      onValueChange={(value) =>
                        setInsertData((prev) => ({
                          ...prev,
                          dataType: value,
                          data: {
                            recordType: "",
                            title: "",
                            description: "",
                            isSensitive: false,
                            // diagnosisCode is optional, so we can omit it or provide a default
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">
                          Patient (Public)
                        </SelectItem>
                        <SelectItem value="medical_record">
                          Medical Record (Confidential/Sensitive)
                        </SelectItem>
                        <SelectItem value="prescription">
                          Prescription (Confidential)
                        </SelectItem>
                        <SelectItem value="appointment">
                          Appointment (Public)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {renderDataForm()}

                  <Button
                    type="submit"
                    disabled={loading || !insertData.dataType}
                    className="w-full"
                  >
                    {loading ? "Inserting..." : "Insert Data"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retrieve">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Retrieve Data</span>
                </CardTitle>
                <CardDescription>
                  Access data based on your role permissions with automatic
                  decryption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="retrieveDataType">
                      Data Type (Optional)
                    </Label>
                    <Select
                      value={retrieveData.dataType}
                      onValueChange={(value) =>
                        setRetrieveData((prev) => ({
                          ...prev,
                          dataType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All data types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="patients">Patients</SelectItem>
                        <SelectItem value="medical_records">
                          Medical Records
                        </SelectItem>
                        <SelectItem value="prescriptions">
                          Prescriptions
                        </SelectItem>
                        <SelectItem value="appointments">
                          Appointments
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="retrievePatientId">
                      Patient ID (Optional)
                    </Label>
                    <Input
                      id="retrievePatientId"
                      type="number"
                      placeholder="Filter by patient"
                      value={retrieveData.patientId}
                      onChange={(e) =>
                        setRetrieveData((prev) => ({
                          ...prev,
                          patientId: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={handleRetrieveData}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Retrieving..." : "Retrieve Data"}
                </Button>

                {retrieveData.results && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Retrieved Data:
                    </h3>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <pre className="text-sm overflow-auto max-h-96">
                        {JSON.stringify(retrieveData.results, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Data Classification & Encryption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800">Public Data</h4>
                  <p className="text-sm text-green-600">
                    Patient contact info, appointments
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-2 bg-green-100 text-green-800"
                  >
                    No Encryption
                  </Badge>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-800">
                    Confidential Data
                  </h4>
                  <p className="text-sm text-yellow-600">
                    Medical records, prescriptions
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-2 bg-yellow-100 text-yellow-800"
                  >
                    Standard Protection
                  </Badge>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-800">Sensitive Data</h4>
                  <p className="text-sm text-red-600">
                    Mental health, genetic info
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-2 bg-red-100 text-red-800"
                  >
                    AES-256 Encrypted
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
