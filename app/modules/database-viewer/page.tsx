"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Lock,
  Unlock,
  Hash,
  Shield,
  Table,
  Search,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface TableData {
  schema: Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }>;
  data: Array<any>;
  count: number;
  hasEncryptedData: boolean;
  hasHashedData: boolean;
}

interface DatabaseData {
  tables: Record<string, TableData>;
  userType: string;
  timestamp: string;
}

export default function DatabaseViewerPage() {
  const [databaseData, setDatabaseData] = useState<DatabaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDecrypted, setShowDecrypted] = useState<Record<string, boolean>>(
    {}
  );
  const [decryptedData, setDecryptedData] = useState<Record<string, string>>(
    {}
  );
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  const fetchDatabaseData = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/database/tables`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDatabaseData(data);
        if (Object.keys(data.tables).length > 0) {
          setSelectedTable(Object.keys(data.tables)[0]);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch database data");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptData = async (encryptedData: string, recordId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/database/decrypt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ encryptedData, recordId }),
      });

      if (response.ok) {
        const result = await response.json();
        setDecryptedData((prev) => ({
          ...prev,
          [recordId]: result.decryptedData,
        }));
        setShowDecrypted((prev) => ({
          ...prev,
          [recordId]: true,
        }));
      } else {
        const errorData = await response.json();
        setError(`Decryption failed: ${errorData.error}`);
      }
    } catch (err) {
      setError("Failed to decrypt data");
    }
  };

  const renderTableData = (tableName: string, tableData: TableData) => {
    const filteredData = tableData.data.filter((row) =>
      Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Table className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{tableName}</h3>
            <Badge variant="outline">{tableData.count} records</Badge>
            {tableData.hasHashedData && (
              <Badge className="bg-orange-100 text-orange-800">
                <Hash className="h-3 w-3 mr-1" />
                Hashed Data
              </Badge>
            )}
            {tableData.hasEncryptedData && (
              <Badge className="bg-red-100 text-red-800">
                <Lock className="h-3 w-3 mr-1" />
                Encrypted Data
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchDatabaseData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Table Schema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Table Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">
                      Column
                    </th>
                    <th className="border border-gray-300 p-2 text-left">
                      Type
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      Not Null
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      Primary Key
                    </th>
                    <th className="border border-gray-300 p-2 text-left">
                      Default
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.schema.map((column) => (
                    <tr key={column.cid}>
                      <td className="border border-gray-300 p-2 font-medium">
                        {column.name}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {column.type}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {column.notnull ? "✅" : "❌"}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {column.pk ? "🔑" : ""}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {column.dflt_value || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Table Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Table Data</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50 sticky top-0">
                    {tableData.schema.map((column) => (
                      <th
                        key={column.name}
                        className="border border-gray-300 p-2 text-left min-w-32"
                      >
                        {column.name}
                        {column.name === "password_hash" && (
                          <Hash className="h-3 w-3 inline ml-1 text-orange-600" />
                        )}
                        {column.name === "description" &&
                          tableName === "medical_records" && (
                            <Lock className="h-3 w-3 inline ml-1 text-red-600" />
                          )}
                      </th>
                    ))}
                    {tableData.hasEncryptedData && (
                      <th className="border border-gray-300 p-2 text-center">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {tableData.schema.map((column) => {
                        const value = row[column.name];
                        const isHashed = column.name === "password_hash";
                        const isEncrypted =
                          column.name === "description" &&
                          tableName === "medical_records" &&
                          row.is_sensitive;
                        const recordId = `${tableName}_${
                          row[tableData.schema.find((c) => c.pk)?.name || "id"]
                        }_${column.name}`;

                        return (
                          <td
                            key={column.name}
                            className="border border-gray-300 p-2"
                          >
                            {isHashed ? (
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant="outline"
                                  className="bg-orange-50 text-orange-700"
                                >
                                  <Hash className="h-3 w-3 mr-1" />
                                  SHA-256
                                </Badge>
                                <span
                                  className="font-mono text-xs truncate max-w-32"
                                  title={value}
                                >
                                  {value}
                                </span>
                              </div>
                            ) : isEncrypted ? (
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant="outline"
                                  className="bg-red-50 text-red-700"
                                >
                                  <Lock className="h-3 w-3 mr-1" />
                                  AES-256
                                </Badge>
                                {showDecrypted[recordId] ? (
                                  <span className="text-green-700 font-medium">
                                    {decryptedData[recordId] || "Decrypted"}
                                  </span>
                                ) : (
                                  <span
                                    className="font-mono text-xs truncate max-w-32"
                                    title={value}
                                  >
                                    {value}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span
                                className={
                                  value?.toString().length > 50
                                    ? "truncate max-w-32"
                                    : ""
                                }
                                title={value}
                              >
                                {value?.toString() || "-"}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      {tableData.hasEncryptedData && (
                        <td className="border border-gray-300 p-2 text-center">
                          {row.is_sensitive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleDecryptData(
                                  row.description,
                                  `${tableName}_${row.record_id}_description`
                                )
                              }
                              disabled={
                                showDecrypted[
                                  `${tableName}_${row.record_id}_description`
                                ]
                              }
                            >
                              {showDecrypted[
                                `${tableName}_${row.record_id}_description`
                              ] ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <Unlock className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading database...</p>
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
                Database Viewer
              </h1>
              <p className="text-gray-600">
                View all database tables, hashed passwords, and encrypted data
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-600">Admin Access</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {databaseData && (
          <>
            {/* Database Overview */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Tables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.keys(databaseData.tables).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(databaseData.tables).reduce(
                      (sum, table) => sum + table.count,
                      0
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Encrypted Tables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {
                      Object.values(databaseData.tables).filter(
                        (table) => table.hasEncryptedData
                      ).length
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Hashed Tables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {
                      Object.values(databaseData.tables).filter(
                        (table) => table.hasHashedData
                      ).length
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Table Tabs */}
            <Tabs value={selectedTable} onValueChange={setSelectedTable}>
              <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6">
                {Object.keys(databaseData.tables).map((tableName) => (
                  <TabsTrigger
                    key={tableName}
                    value={tableName}
                    className="text-xs"
                  >
                    {tableName}
                    {databaseData.tables[tableName].hasHashedData && (
                      <Hash className="h-3 w-3 ml-1 text-orange-600" />
                    )}
                    {databaseData.tables[tableName].hasEncryptedData && (
                      <Lock className="h-3 w-3 ml-1 text-red-600" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(databaseData.tables).map(
                ([tableName, tableData]) => (
                  <TabsContent key={tableName} value={tableName}>
                    {renderTableData(tableName, tableData)}
                  </TabsContent>
                )
              )}
            </Tabs>

            {/* Security Information */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Security Implementation Details</CardTitle>
                <CardDescription>
                  Understanding the encryption and hashing in the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Hash className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold text-orange-800">
                        Password Hashing
                      </h4>
                    </div>
                    <p className="text-sm text-orange-700 mb-2">
                      User passwords are hashed using bcrypt with SHA-256
                    </p>
                    <Badge
                      variant="outline"
                      className="bg-orange-100 text-orange-800"
                    >
                      bcrypt + SHA-256
                    </Badge>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lock className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold text-red-800">
                        Data Encryption
                      </h4>
                    </div>
                    <p className="text-sm text-red-700 mb-2">
                      Sensitive medical records are encrypted with AES-256
                    </p>
                    <Badge
                      variant="outline"
                      className="bg-red-100 text-red-800"
                    >
                      AES-256-GCM
                    </Badge>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">
                        Access Control
                      </h4>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">
                      Role-based access with JWT tokens and audit logging
                    </p>
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800"
                    >
                      JWT + RBAC
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
