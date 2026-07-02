import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MedicalInstructionsDictionary } from "@/components/MedicalInstructionsDictionary";
import { PrescriptionComposer } from "@/components/PrescriptionComposer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle } from "lucide-react";

export default function FastOPDWorkflow() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Fast OPD Workflow</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Patient Context Sidebar (Mock) */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Patient</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <UserCircle className="h-12 w-12 text-primary/20" />
                <div>
                  <div className="text-lg font-bold">John Doe</div>
                  <div className="text-sm text-muted-foreground">35 M | ID: PT-0012</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">BP:</span>
                  <span>120/80 mmHg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temp:</span>
                  <span>98.6 °F</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Work Area */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="prescription" className="space-y-4">
            <TabsList>
              <TabsTrigger value="prescription">Prescription</TabsTrigger>
              <TabsTrigger value="dictionary">Dictionary & Config</TabsTrigger>
            </TabsList>
            
            <TabsContent value="prescription" className="space-y-4">
              <PrescriptionComposer />
            </TabsContent>
            
            <TabsContent value="dictionary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Instructions Config</CardTitle>
                  <CardDescription>
                    Manage English to Urdu translations for prescriptions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MedicalInstructionsDictionary />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
