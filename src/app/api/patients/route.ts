import { NextResponse } from "next/server";
import { allPatients } from "@/lib/patient-data";
import type { PatientStatus } from "@/lib/patient-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as PatientStatus | null;
  const search = searchParams.get("search")?.toLowerCase() || "";

  let patients = allPatients;

  // Filter by status if provided
  if (status && (status === "inpatient" || status === "discharged")) {
    patients = patients.filter((p) => p.status === status);
  }

  // Search filter
  if (search) {
    patients = patients.filter(
      (p) =>
        p.basicInfo.name.toLowerCase().includes(search) ||
        p.basicInfo.patient_no.toLowerCase().includes(search) ||
        p.basicInfo.department.toLowerCase().includes(search) ||
        p.basicInfo.chief_complaint.toLowerCase().includes(search)
    );
  }

  // Return summary list (not full patient data to reduce payload)
  const summary = patients.map((p) => ({
    id: p.id,
    status: p.status,
    name: p.basicInfo.name,
    gender: p.basicInfo.gender,
    age: p.basicInfo.age,
    patient_no: p.basicInfo.patient_no,
    department: p.basicInfo.department,
    bed_no: p.basicInfo.bed_no,
    admission_date: p.basicInfo.admission_date,
    attending_doctor: p.basicInfo.attending_doctor,
    chief_complaint: p.basicInfo.chief_complaint,
    diagnosis_count: p.diagnoses.length,
    exam_count: p.exams.length,
    lab_count: p.labReports.length,
    surgery_count: p.surgeries.length,
    emr_count: p.emrs.length,
  }));

  const inpatientCount = allPatients.filter((p) => p.status === "inpatient").length;
  const dischargedCount = allPatients.filter((p) => p.status === "discharged").length;

  return NextResponse.json({
    patients: summary,
    total: allPatients.length,
    inpatientCount,
    dischargedCount,
  });
}
