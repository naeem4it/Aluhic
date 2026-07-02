CREATE TABLE "account_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	CONSTRAINT "account_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ai_appointment_optimizations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"doctor_id" varchar,
	"patient_id" varchar,
	"suggested_date" timestamp NOT NULL,
	"suggested_time_slot" text NOT NULL,
	"confidence_score" numeric(5, 4),
	"reasoning_factors" jsonb,
	"urgency_level" text DEFAULT 'normal' NOT NULL,
	"expected_wait_time" integer,
	"is_accepted" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_call_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"plan_date" timestamp NOT NULL,
	"territory" text,
	"suggested_doctors" jsonb NOT NULL,
	"optimized_route" jsonb,
	"total_estimated_time" integer,
	"total_travel_distance" numeric(10, 2),
	"expected_conversions" integer,
	"model_version" text,
	"status" text DEFAULT 'suggested' NOT NULL,
	"actual_outcome" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_lab_suggestions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"consultation_id" varchar,
	"symptoms" text[],
	"suggested_tests" jsonb NOT NULL,
	"confidence_score" numeric(5, 4),
	"diagnostic_pattern" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_tests" jsonb,
	"approved_by" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anomaly_detections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"detection_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"metric" text NOT NULL,
	"expected_value" numeric(12, 4),
	"actual_value" numeric(12, 4) NOT NULL,
	"deviation" numeric(10, 4) NOT NULL,
	"deviation_type" text NOT NULL,
	"anomaly_score" numeric(5, 4) NOT NULL,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"possible_causes" jsonb,
	"detection_method" text,
	"investigation_status" text DEFAULT 'pending' NOT NULL,
	"investigation_notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"appointment_date" timestamp NOT NULL,
	"appointment_time" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" varchar,
	"actor_person_id" varchar,
	"actor_organization_id" varchar,
	"actor_ip_address" varchar(45),
	"actor_user_agent" text,
	"action" text NOT NULL,
	"action_category" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" varchar,
	"target_organization_id" varchar,
	"previous_data" jsonb,
	"new_data" jsonb,
	"changed_fields" jsonb,
	"session_id" varchar,
	"request_path" text,
	"request_method" varchar(10),
	"description" text,
	"severity" text DEFAULT 'info',
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automated_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"user_id" varchar,
	"insight_type" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"data_points" jsonb,
	"severity" text NOT NULL,
	"priority" integer NOT NULL,
	"affected_entity" text,
	"affected_entity_id" varchar,
	"recommendation" text,
	"action_required" boolean DEFAULT false,
	"action_taken" text,
	"dismissed" boolean DEFAULT false,
	"dismissed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_kpis" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"rep_name" text,
	"territory" text,
	"total_calls_done" integer DEFAULT 0 NOT NULL,
	"total_planned_calls" integer DEFAULT 0 NOT NULL,
	"planned_calls_done" integer DEFAULT 0 NOT NULL,
	"unplanned_calls_done" integer DEFAULT 0 NOT NULL,
	"total_edas_viewed" integer DEFAULT 0 NOT NULL,
	"total_slides_viewed" integer DEFAULT 0 NOT NULL,
	"avg_time_per_call" integer DEFAULT 0,
	"avg_time_per_eda" integer DEFAULT 0,
	"avg_time_per_slide" integer DEFAULT 0,
	"target_doctors" integer DEFAULT 0,
	"planned_doctors" integer DEFAULT 0,
	"covered_doctors" integer DEFAULT 0,
	"contact_point_status" text DEFAULT 'reported',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_predictions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"campaign_name" text NOT NULL,
	"campaign_type" text NOT NULL,
	"target_segment" text,
	"target_doctor_ids" text[],
	"product_ids" text[],
	"estimated_cost" numeric(12, 2),
	"predicted_roi" numeric(5, 4) NOT NULL,
	"predicted_reach" integer,
	"predicted_conversions" integer,
	"predicted_revenue" numeric(12, 2),
	"confidence_score" numeric(5, 4),
	"historical_basis" jsonb,
	"recommendations" jsonb,
	"actual_roi" numeric(5, 4),
	"actual_revenue" numeric(12, 2),
	"campaign_status" text DEFAULT 'planned' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" varchar,
	"phone" text,
	"address" text,
	"logo_url" text,
	"company_type_id" varchar,
	"registration_date" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	CONSTRAINT "company_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "competitive_intelligence" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"analysis_type" text NOT NULL,
	"source_type" text NOT NULL,
	"territory" text,
	"competitor_name" text,
	"competitor_product" text,
	"insight" text NOT NULL,
	"insight_category" text,
	"sentiment" text,
	"impact_level" text NOT NULL,
	"confidence" numeric(5, 4),
	"keywords" text[],
	"related_doctor_ids" text[],
	"suggested_actions" jsonb,
	"expiry_date" timestamp,
	"validated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"queue_entry_id" varchar,
	"chief_complaint" text,
	"observations" text,
	"diagnosis" text,
	"treatment_plan" text,
	"follow_up_date" timestamp,
	"notes" text,
	"consultation_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_transfer_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requested_by" varchar NOT NULL,
	"requested_by_organization_id" varchar,
	"request_type" text NOT NULL,
	"data_scope" text NOT NULL,
	"data_categories" jsonb,
	"purpose" text NOT NULL,
	"justification" text,
	"date_range_start" timestamp,
	"date_range_end" timestamp,
	"estimated_record_count" integer,
	"destination_type" text,
	"destination_details" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"rejection_reason" text,
	"approval_expires_at" timestamp,
	"executed_at" timestamp,
	"download_url" text,
	"download_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_upload_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"entity_type" text NOT NULL,
	"columns" jsonb NOT NULL,
	"sample_data" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "data_upload_templates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "data_uploads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar,
	"user_id" varchar NOT NULL,
	"template_id" varchar,
	"file_name" text NOT NULL,
	"file_url" text,
	"file_type" text NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"successful_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_log" jsonb,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demand_forecasts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"facility_id" varchar,
	"product_id" varchar,
	"forecast_type" text NOT NULL,
	"forecast_period" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"predicted_demand" integer NOT NULL,
	"confidence_score" numeric(5, 4),
	"confidence_interval" jsonb,
	"historical_data" jsonb,
	"seasonal_factors" jsonb,
	"actual_demand" integer,
	"accuracy" numeric(5, 4),
	"model_version" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispense_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_order_id" varchar NOT NULL,
	"medicine_id" varchar NOT NULL,
	"stock_ledger_entry_id" varchar,
	"quantity_dispensed" integer NOT NULL,
	"batch_number" varchar(50),
	"expiry_date" timestamp,
	"unit_price" numeric(10, 2),
	"total_price" numeric(10, 2),
	"dispensed_at" timestamp DEFAULT now() NOT NULL,
	"dispensed_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" varchar NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_engagements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"doctor_id" varchar NOT NULL,
	"user_id" varchar,
	"engagement_score" numeric(5, 4) NOT NULL,
	"engagement_level" text NOT NULL,
	"visit_frequency" integer,
	"prescription_volume" integer,
	"sample_conversion_rate" numeric(5, 4),
	"response_to_campaigns" numeric(5, 4),
	"potential_value" numeric(12, 2),
	"recommendations" jsonb,
	"cluster_group" text,
	"last_visit_date" timestamp,
	"next_recommended_action" text,
	"valid_until" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_expenditures" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"organization_id" varchar,
	"expenditure_date" timestamp NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"receipt_url" text,
	"product_id" varchar,
	"sample_quantity" integer,
	"event_name" text,
	"event_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_payroll_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"pay_period_start" timestamp NOT NULL,
	"pay_period_end" timestamp NOT NULL,
	"agreement_type" text NOT NULL,
	"base_salary" numeric(12, 2) DEFAULT '0',
	"total_patients_seen" integer DEFAULT 0,
	"per_patient_fee" numeric(10, 2),
	"patient_fee_earnings" numeric(12, 2) DEFAULT '0',
	"total_consultation_revenue" numeric(12, 2) DEFAULT '0',
	"commission_percentage" numeric(5, 2),
	"commission_earnings" numeric(12, 2) DEFAULT '0',
	"allowances" numeric(12, 2) DEFAULT '0',
	"deductions" numeric(12, 2) DEFAULT '0',
	"bonus" numeric(12, 2) DEFAULT '0',
	"gross_earnings" numeric(12, 2) NOT NULL,
	"net_payable" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"payment_date" timestamp,
	"payment_method" text,
	"payment_reference" text,
	"notes" text,
	"approved_by" varchar,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_visits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"punch_in_time" timestamp NOT NULL,
	"punch_out_time" timestamp,
	"punch_in_latitude" numeric(10, 8),
	"punch_in_longitude" numeric(11, 8),
	"punch_out_latitude" numeric(10, 8),
	"punch_out_longitude" numeric(11, 8),
	"visit_notes" text,
	"sale_agreement" boolean DEFAULT false,
	"sale_agreement_details" text,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"specialty" text,
	"clinic" text,
	"phone" text,
	"email" text,
	"address" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drug_interactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drug1_name" text NOT NULL,
	"drug2_name" text NOT NULL,
	"interaction_type" text NOT NULL,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"mechanism" text,
	"management_advice" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "employee_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"role_id" varchar NOT NULL,
	"invitation_token" varchar NOT NULL,
	"invited_by" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"accepted_user_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_invitations_invitation_token_unique" UNIQUE("invitation_token")
);
--> statement-breakpoint
CREATE TABLE "expense_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" varchar NOT NULL,
	"approver_id" varchar NOT NULL,
	"approval_level" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"comments" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_sheets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"approved_amount" numeric(12, 2),
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"payment_date" timestamp,
	"payment_reference" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"territory" text,
	"receipt_number" text,
	"payment_mode" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expiry_predictions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"facility_id" varchar,
	"product_id" varchar,
	"batch_number" text,
	"current_stock" integer NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"days_until_expiry" integer NOT NULL,
	"usage_rate" numeric(10, 4),
	"wastage_risk" text NOT NULL,
	"wastage_risk_score" numeric(5, 4),
	"predicted_waste" integer,
	"recommendation" text NOT NULL,
	"suggested_actions" jsonb,
	"redistribution_targets" jsonb,
	"actual_waste" integer,
	"action_taken" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_modules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"category" text,
	"applicable_org_types" text[],
	"is_core" boolean DEFAULT false NOT NULL,
	"price_monthly" numeric(10, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_modules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "healthcare_doctors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"specialty" text,
	"qualification" text,
	"phone" text,
	"email" varchar,
	"consultation_fee" numeric(10, 2),
	"agreement_type" text NOT NULL,
	"monthly_salary" numeric(10, 2),
	"per_patient_fee" numeric(10, 2),
	"percentage_share" numeric(5, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "healthcare_facilities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"name" text NOT NULL,
	"facility_type" text NOT NULL,
	"address" text,
	"phone" text,
	"email" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hospital_departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"description" text,
	"head_doctor_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hospital_doctor_associations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"doctor_user_id" varchar NOT NULL,
	"department_id" varchar,
	"association_type" text NOT NULL,
	"monthly_salary" numeric(12, 2),
	"per_patient_fee" numeric(10, 2),
	"commission_percentage" numeric(5, 2),
	"consultation_fee" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"joining_date" timestamp,
	"termination_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intelligence_data" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" varchar NOT NULL,
	"data_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"raw_data" jsonb,
	"processed_data" jsonb,
	"relevance_score" numeric(3, 2),
	"region" text,
	"related_diseases" text[],
	"related_medicines" text[],
	"effective_date" timestamp,
	"expiry_date" timestamp,
	"is_processed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intelligence_sources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"category" text NOT NULL,
	"source_url" text,
	"api_endpoint" text,
	"requires_auth" boolean DEFAULT false NOT NULL,
	"credentials_key" text,
	"data_format" text,
	"refresh_interval" integer,
	"last_fetched_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"weight" numeric(3, 2) DEFAULT '1.00',
	"is_short_term" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "intelligence_sources_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "lab_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_order_id" varchar NOT NULL,
	"test_code" varchar(50),
	"test_name" text NOT NULL,
	"test_category" text,
	"price" numeric(10, 2),
	"discount" numeric(10, 2) DEFAULT '0',
	"final_price" numeric(10, 2),
	"assigned_technician_id" varchar,
	"status" text DEFAULT 'pending' NOT NULL,
	"sample_collected_at" timestamp,
	"processed_at" timestamp,
	"completed_at" timestamp,
	"sample_type" text,
	"sample_id" varchar(50),
	"special_instructions" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(30) NOT NULL,
	"ordering_organization_id" varchar,
	"ordering_facility_id" varchar,
	"lab_organization_id" varchar,
	"patient_person_id" varchar NOT NULL,
	"ordering_doctor_context_id" varchar,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"priority" text DEFAULT 'routine',
	"clinical_notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"received_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"total_amount" numeric(12, 2),
	"paid_amount" numeric(12, 2) DEFAULT '0',
	"payment_status" text DEFAULT 'pending',
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lab_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "lab_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_order_id" varchar NOT NULL,
	"patient_person_id" varchar NOT NULL,
	"report_number" varchar(30) NOT NULL,
	"report_url" text,
	"report_data" jsonb,
	"report_title" text,
	"report_date" timestamp NOT NULL,
	"generated_by" varchar,
	"approved_by" varchar,
	"approved_at" timestamp,
	"is_released" boolean DEFAULT false NOT NULL,
	"released_at" timestamp,
	"viewed_by_doctor" boolean DEFAULT false,
	"viewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_order_item_id" varchar NOT NULL,
	"result_data" jsonb,
	"result_summary" text,
	"interpretation" text,
	"reference_range" text,
	"abnormal_flags" text,
	"result_entered_by" varchar,
	"result_entered_at" timestamp,
	"verified_by" varchar,
	"verified_at" timestamp,
	"is_verified" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"released_at" timestamp,
	"released_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_segments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"segment_type" text NOT NULL,
	"segment_name" text NOT NULL,
	"segment_description" text,
	"entity_ids" text[],
	"characteristics" jsonb,
	"size" integer NOT NULL,
	"potential_value" numeric(12, 2),
	"current_value" numeric(12, 2),
	"growth_rate" numeric(5, 4),
	"marketing_strategy" text,
	"target_products" text[],
	"recommended_campaigns" jsonb,
	"clustering_method" text,
	"valid_until" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generic_name" text NOT NULL,
	"brand_names" text[],
	"category" text NOT NULL,
	"therapeutic_class" text,
	"standard_dosage" text,
	"max_daily_dose" text,
	"contraindications" text[],
	"common_side_effects" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicine_stock_ledger" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medicine_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"batch_number" varchar(50),
	"expiry_date" timestamp,
	"manufacturing_date" timestamp,
	"transaction_type" text NOT NULL,
	"quantity" integer NOT NULL,
	"previous_stock" integer DEFAULT 0 NOT NULL,
	"new_stock" integer NOT NULL,
	"unit_price" numeric(10, 2),
	"total_amount" numeric(12, 2),
	"reference_type" text,
	"reference_id" varchar,
	"supplier_id" varchar,
	"notes" text,
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicines" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"name" text NOT NULL,
	"generic_name" text,
	"brand_name" text,
	"manufacturer" text,
	"category" text,
	"strength" text,
	"pack_size" text,
	"barcode" varchar(50),
	"sku" varchar(50),
	"purchase_price" numeric(10, 2),
	"selling_price" numeric(10, 2) NOT NULL,
	"mrp" numeric(10, 2),
	"reorder_level" integer DEFAULT 10,
	"min_stock_level" integer DEFAULT 5,
	"requires_prescription" boolean DEFAULT false,
	"is_controlled" boolean DEFAULT false,
	"storage_instructions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mr_performance_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"insight_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text NOT NULL,
	"action_items" jsonb,
	"related_doctor_id" varchar,
	"related_product_id" varchar,
	"expected_impact" jsonb,
	"confidence_score" numeric(5, 4),
	"status" text DEFAULT 'new' NOT NULL,
	"viewed_at" timestamp,
	"valid_until" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mr_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"company_id" varchar,
	"employee_id" text,
	"kyc_document_url" text,
	"kyc_status" text DEFAULT 'pending' NOT NULL,
	"visit_quota" integer,
	"sample_quota" integer,
	"assigned_territories" text[],
	"target_doctor_ids" text[],
	"joining_date" timestamp,
	"reporting_to" varchar,
	"performance_rating" numeric(3, 2),
	"is_field_active" boolean DEFAULT true NOT NULL,
	"last_active_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mr_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "nl_queries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"company_id" varchar,
	"query" text NOT NULL,
	"parsed_intent" text,
	"parsed_entities" jsonb,
	"generated_sql" text,
	"visualization_type" text,
	"response_data" jsonb,
	"response_text" text,
	"successful" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"execution_time_ms" integer,
	"feedback_rating" integer,
	"feedback_comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_employees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role_id" varchar NOT NULL,
	"employee_code" text,
	"department" text,
	"designation" text,
	"joining_date" timestamp,
	"termination_date" timestamp,
	"terminated_by" varchar,
	"termination_reason" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"reporting_to" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_modules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"module_id" varchar NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"enabled_at" timestamp DEFAULT now() NOT NULL,
	"enabled_by" varchar,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"organization_type_id" varchar NOT NULL,
	"email" varchar,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'Pakistan',
	"logo_url" text,
	"owner_id" varchar,
	"subscription_tier" text DEFAULT 'basic' NOT NULL,
	"subscription_start_date" timestamp DEFAULT now() NOT NULL,
	"subscription_end_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"suspended_reason" text,
	"suspended_at" timestamp,
	"suspended_by" varchar,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "patient_risk_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"facility_id" varchar NOT NULL,
	"risk_type" text NOT NULL,
	"risk_score" numeric(5, 4) NOT NULL,
	"risk_level" text NOT NULL,
	"contributing_factors" jsonb,
	"recommendations" jsonb,
	"alert_sent" boolean DEFAULT false NOT NULL,
	"acknowledged_by" varchar,
	"acknowledged_at" timestamp,
	"valid_until" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_tracking_numbers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"tracking_number" text NOT NULL,
	"visit_date" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"doctor_id" varchar,
	"chief_complaint" text,
	"notes" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_vitals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"queue_entry_id" varchar,
	"temperature" numeric(4, 1),
	"blood_pressure_systolic" integer,
	"blood_pressure_diastolic" integer,
	"pulse_rate" integer,
	"oxygen_level" numeric(5, 2),
	"sugar_level" numeric(5, 2),
	"weight" numeric(5, 2),
	"height" numeric(5, 2),
	"notes" text,
	"recorded_by" varchar,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"patient_number" text NOT NULL,
	"name" text NOT NULL,
	"age" integer,
	"gender" text,
	"phone" text,
	"email" varchar,
	"address" text,
	"blood_group" text,
	"allergies" text,
	"medical_history" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"appointment_id" varchar,
	"queue_entry_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"payment_status" text DEFAULT 'completed' NOT NULL,
	"receipt_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"pay_period_start" timestamp NOT NULL,
	"pay_period_end" timestamp NOT NULL,
	"base_salary" numeric(12, 2) NOT NULL,
	"allowances" numeric(12, 2) DEFAULT '0',
	"deductions" numeric(12, 2) DEFAULT '0',
	"bonus" numeric(12, 2) DEFAULT '0',
	"net_salary" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"payment_date" timestamp,
	"payment_method" text,
	"payment_reference" text,
	"notes" text,
	"approved_by" varchar,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person_contexts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"organization_type" text NOT NULL,
	"role_type" text NOT NULL,
	"department" text,
	"designation" text,
	"employment_type" text,
	"hire_date" timestamp,
	"termination_date" timestamp,
	"termination_reason" text,
	"status" text DEFAULT 'active' NOT NULL,
	"agreement_type" text,
	"monthly_salary" numeric(12, 2),
	"per_patient_fee" numeric(10, 2),
	"percentage_share" numeric(5, 2),
	"consultation_fee" numeric(10, 2),
	"specialty" text,
	"qualification" text,
	"license_number" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cnic" varchar(15),
	"phone" varchar(20),
	"first_name" text NOT NULL,
	"last_name" text,
	"date_of_birth" timestamp,
	"gender" text,
	"email" varchar,
	"alternate_phone" varchar(20),
	"address" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'Pakistan',
	"postal_code" varchar(10),
	"blood_group" text,
	"allergies" text,
	"medical_history" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" varchar(20),
	"profile_image_url" text,
	"user_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"verified_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar,
	CONSTRAINT "persons_cnic_unique" UNIQUE("cnic")
);
--> statement-breakpoint
CREATE TABLE "pharma_company_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"max_mrs" integer,
	"max_products" integer,
	"product_categories" text[],
	"license_number" text,
	"license_expiry_date" timestamp,
	"head_office_address" text,
	"contact_person" text,
	"contact_phone" text,
	"contact_email" text,
	"subscription_tier" text DEFAULT 'basic' NOT NULL,
	"features" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pharma_company_settings_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "predictive_kpis" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"user_id" varchar,
	"facility_id" varchar,
	"kpi_type" text NOT NULL,
	"forecast_period" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"current_value" numeric(12, 2),
	"predicted_value" numeric(12, 2) NOT NULL,
	"target_value" numeric(12, 2),
	"predicted_achievement" numeric(5, 4),
	"confidence_score" numeric(5, 4),
	"confidence_interval" jsonb,
	"trend" text,
	"trend_strength" numeric(5, 4),
	"risk_factors" jsonb,
	"opportunities" jsonb,
	"actual_value" numeric(12, 2),
	"accuracy" numeric(5, 4),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(30) NOT NULL,
	"organization_id" varchar NOT NULL,
	"patient_person_id" varchar NOT NULL,
	"prescribing_doctor_context_id" varchar,
	"prescription_id" varchar,
	"consultation_id" varchar,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal" numeric(12, 2),
	"discount" numeric(10, 2) DEFAULT '0',
	"tax" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0',
	"payment_status" text DEFAULT 'pending',
	"payment_method" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"dispensed_at" timestamp,
	"dispensed_by" varchar,
	"queue_token_id" varchar,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prescription_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "prescription_validations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"validation_status" text NOT NULL,
	"drug_interactions" jsonb,
	"dosage_warnings" jsonb,
	"allergy_alerts" jsonb,
	"duplicate_therapy" jsonb,
	"contraindicated_conditions" jsonb,
	"overall_risk_level" text NOT NULL,
	"requires_pharmacist_review" boolean DEFAULT false NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"override_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"medications" jsonb NOT NULL,
	"instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_price_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"effective_date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_samples" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"company_id" varchar,
	"batch_number" text,
	"quantity" integer DEFAULT 0 NOT NULL,
	"expiry_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"current_price" numeric(10, 2) NOT NULL,
	"category" text,
	"manufacturer" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_day_states" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"queue_definition_id" varchar NOT NULL,
	"queue_date" timestamp NOT NULL,
	"current_number" integer DEFAULT 0 NOT NULL,
	"last_issued_number" integer DEFAULT 0 NOT NULL,
	"total_tokens_issued" integer DEFAULT 0 NOT NULL,
	"total_tokens_completed" integer DEFAULT 0 NOT NULL,
	"total_tokens_cancelled" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"opened_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_definitions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"facility_id" varchar,
	"queue_type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_number" integer DEFAULT 1 NOT NULL,
	"prefix" varchar(5),
	"doctor_context_id" varchar,
	"operating_start_time" text,
	"operating_end_time" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"queue_number" integer NOT NULL,
	"queue_date" timestamp NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"checked_in_at" timestamp DEFAULT now() NOT NULL,
	"called_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"queue_day_state_id" varchar NOT NULL,
	"queue_definition_id" varchar NOT NULL,
	"token_number" integer NOT NULL,
	"token_display" varchar(20) NOT NULL,
	"patient_person_id" varchar,
	"patient_name" text,
	"patient_phone" varchar(20),
	"status" text DEFAULT 'waiting' NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"called_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"issued_by" varchar,
	"called_by" varchar,
	"completed_by" varchar,
	"priority" text DEFAULT 'normal',
	"notes" text,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reorder_suggestions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"facility_id" varchar,
	"product_id" varchar,
	"current_stock" integer NOT NULL,
	"reorder_point" integer NOT NULL,
	"suggested_quantity" integer NOT NULL,
	"optimal_order_date" timestamp NOT NULL,
	"urgency" text NOT NULL,
	"usage_pattern" jsonb,
	"seasonal_adjustment" numeric(5, 4),
	"cost_optimization" jsonb,
	"lead_time" integer,
	"safety_stock" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"ordered_quantity" integer,
	"order_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" varchar NOT NULL,
	"module_code" text NOT NULL,
	"can_view" boolean DEFAULT false NOT NULL,
	"can_create" boolean DEFAULT false NOT NULL,
	"can_edit" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"can_export" boolean DEFAULT false NOT NULL,
	"can_approve" boolean DEFAULT false NOT NULL,
	"custom_permissions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"company_type_id" varchar,
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "route_plan_stops" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_plan_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"stop_order" integer NOT NULL,
	"planned_time" text,
	"actual_arrival" timestamp,
	"actual_departure" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"plan_date" timestamp NOT NULL,
	"territory" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"rep_name" text NOT NULL,
	"territory" text NOT NULL,
	"doctor_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"rate" numeric(10, 2) NOT NULL,
	"price_override" numeric(10, 2),
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_mode" text NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_forecasts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"user_id" varchar,
	"doctor_id" varchar,
	"product_id" varchar,
	"territory" text,
	"forecast_period" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"predicted_sales" numeric(12, 2) NOT NULL,
	"predicted_quantity" integer,
	"confidence_interval" jsonb,
	"confidence_score" numeric(5, 4),
	"historical_basis" jsonb,
	"actual_sales" numeric(12, 2),
	"accuracy" numeric(5, 4),
	"model_version" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"company_id" varchar,
	"doctor_id" varchar NOT NULL,
	"product_id" varchar,
	"status" text DEFAULT 'new' NOT NULL,
	"estimated_quantity" integer,
	"estimated_value" numeric(10, 2),
	"priority" text DEFAULT 'medium' NOT NULL,
	"source" text,
	"notes" text,
	"follow_up_date" timestamp,
	"converted_to_order_id" varchar,
	"lost_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sample_conversion_predictions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sample_distribution_id" varchar,
	"user_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"sample_quantity" integer NOT NULL,
	"conversion_probability" numeric(5, 4) NOT NULL,
	"expected_prescriptions" integer,
	"expected_revenue" numeric(12, 2),
	"influencing_factors" jsonb,
	"recommendation" text NOT NULL,
	"actual_conversion" boolean,
	"actual_prescriptions" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sample_distributions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"product_sample_id" varchar NOT NULL,
	"visit_id" varchar,
	"quantity" integer NOT NULL,
	"distribution_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" varchar NOT NULL,
	"product_id" varchar,
	"item_name" text NOT NULL,
	"item_code" text NOT NULL,
	"category" text,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"current_quantity" numeric(12, 2) DEFAULT '0' NOT NULL,
	"reorder_level" numeric(12, 2) DEFAULT '10',
	"max_level" numeric(12, 2),
	"cost_price" numeric(10, 2),
	"selling_price" numeric(10, 2),
	"batch_number" text,
	"expiry_date" timestamp,
	"manufacturer" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stock_item_id" varchar NOT NULL,
	"warehouse_id" varchar NOT NULL,
	"movement_type" text NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"previous_quantity" numeric(12, 2) NOT NULL,
	"new_quantity" numeric(12, 2) NOT NULL,
	"reference_type" text,
	"reference_id" varchar,
	"unit_price" numeric(10, 2),
	"total_value" numeric(12, 2),
	"batch_number" text,
	"expiry_date" timestamp,
	"from_warehouse_id" varchar,
	"to_warehouse_id" varchar,
	"reason" text,
	"notes" text,
	"performed_by" varchar NOT NULL,
	"movement_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_monthly" numeric(10, 2) NOT NULL,
	"price_yearly" numeric(10, 2),
	"max_users" integer,
	"max_facilities" integer,
	"features" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"organization_type_code" text NOT NULL,
	"description" text,
	"price_monthly" numeric(10, 2) NOT NULL,
	"price_yearly" numeric(10, 2),
	"included_modules" text[],
	"max_users" integer,
	"max_employees" integer,
	"max_medical_reps" integer,
	"max_doctors" integer,
	"features" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_tiers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"company_id" varchar,
	"plan_id" varchar NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"trial_ends_at" timestamp,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"last_payment_date" timestamp,
	"next_payment_date" timestamp,
	"payment_method" text,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "target_achievement_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"metric_name" text NOT NULL,
	"current_value" numeric(10, 2),
	"target_value" numeric(10, 2),
	"variance" numeric(10, 2),
	"related_doctor_id" varchar,
	"suggested_actions" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"acknowledged_by" varchar,
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teleconsult_triages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar,
	"facility_id" varchar NOT NULL,
	"patient_complaint" text NOT NULL,
	"extracted_symptoms" text[],
	"category" text NOT NULL,
	"urgency_level" text NOT NULL,
	"suggested_specialty" text,
	"suggested_action" text NOT NULL,
	"confidence_score" numeric(5, 4),
	"red_flags" text[],
	"assigned_doctor_id" varchar,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"consultation_id" varchar,
	"test_name" text NOT NULL,
	"test_type" text,
	"report_url" text,
	"report_data" jsonb,
	"lab_name" text,
	"lab_attached" boolean DEFAULT false,
	"test_date" timestamp,
	"uploaded_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_expense_details" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" varchar NOT NULL,
	"from_location" text NOT NULL,
	"to_location" text NOT NULL,
	"transport_mode" text NOT NULL,
	"distance_km" numeric(10, 2),
	"fuel_liters" numeric(10, 2),
	"fuel_rate" numeric(10, 2),
	"toll_charges" numeric(10, 2),
	"parking_charges" numeric(10, 2),
	"receipt_url" text,
	"departure_time" timestamp,
	"arrival_time" timestamp,
	"purpose" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"user_type" text DEFAULT 'individual' NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"account_type_id" varchar,
	"role_id" varchar,
	"organization_id" varchar,
	"is_super_admin" boolean DEFAULT false NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp,
	"territory" text,
	"company_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"permissions" jsonb,
	"trial_start_date" timestamp,
	"trial_end_date" timestamp,
	"subscription_active" text DEFAULT 'trial' NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visit_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"requested_date" timestamp NOT NULL,
	"requested_time" text,
	"purpose" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"doctor_notes" text,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar,
	"facility_id" varchar,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"address" text,
	"phone" text,
	"warehouse_type" text DEFAULT 'main' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_appointment_optimizations" ADD CONSTRAINT "ai_appointment_optimizations_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_appointment_optimizations" ADD CONSTRAINT "ai_appointment_optimizations_doctor_id_healthcare_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."healthcare_doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_appointment_optimizations" ADD CONSTRAINT "ai_appointment_optimizations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_call_plans" ADD CONSTRAINT "ai_call_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_lab_suggestions" ADD CONSTRAINT "ai_lab_suggestions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_lab_suggestions" ADD CONSTRAINT "ai_lab_suggestions_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_lab_suggestions" ADD CONSTRAINT "ai_lab_suggestions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anomaly_detections" ADD CONSTRAINT "anomaly_detections_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_healthcare_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."healthcare_doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_person_id_persons_id_fk" FOREIGN KEY ("actor_person_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_organization_id_organizations_id_fk" FOREIGN KEY ("actor_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_organization_id_organizations_id_fk" FOREIGN KEY ("target_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automated_insights" ADD CONSTRAINT "automated_insights_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automated_insights" ADD CONSTRAINT "automated_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_kpis" ADD CONSTRAINT "call_kpis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_predictions" ADD CONSTRAINT "campaign_predictions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_company_type_id_company_types_id_fk" FOREIGN KEY ("company_type_id") REFERENCES "public"."company_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitive_intelligence" ADD CONSTRAINT "competitive_intelligence_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctor_id_healthcare_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."healthcare_doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_queue_entry_id_queue_entries_id_fk" FOREIGN KEY ("queue_entry_id") REFERENCES "public"."queue_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_transfer_requests" ADD CONSTRAINT "data_transfer_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_transfer_requests" ADD CONSTRAINT "data_transfer_requests_requested_by_organization_id_organizations_id_fk" FOREIGN KEY ("requested_by_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_transfer_requests" ADD CONSTRAINT "data_transfer_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_uploads" ADD CONSTRAINT "data_uploads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_uploads" ADD CONSTRAINT "data_uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_uploads" ADD CONSTRAINT "data_uploads_template_id_data_upload_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."data_upload_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispense_events" ADD CONSTRAINT "dispense_events_prescription_order_id_prescription_orders_id_fk" FOREIGN KEY ("prescription_order_id") REFERENCES "public"."prescription_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispense_events" ADD CONSTRAINT "dispense_events_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispense_events" ADD CONSTRAINT "dispense_events_stock_ledger_entry_id_medicine_stock_ledger_id_fk" FOREIGN KEY ("stock_ledger_entry_id") REFERENCES "public"."medicine_stock_ledger"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispense_events" ADD CONSTRAINT "dispense_events_dispensed_by_person_contexts_id_fk" FOREIGN KEY ("dispensed_by") REFERENCES "public"."person_contexts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctor_id_healthcare_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."healthcare_doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_engagements" ADD CONSTRAINT "doctor_engagements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_engagements" ADD CONSTRAINT "doctor_engagements_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_engagements" ADD CONSTRAINT "doctor_engagements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_expenditures" ADD CONSTRAINT "doctor_expenditures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_expenditures" ADD CONSTRAINT "doctor_expenditures_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_expenditures" ADD CONSTRAINT "doctor_expenditures_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_expenditures" ADD CONSTRAINT "doctor_expenditures_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_expenditures" ADD CONSTRAINT "doctor_expenditures_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_payroll_records" ADD CONSTRAINT "doctor_payroll_records_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_payroll_records" ADD CONSTRAINT "doctor_payroll_records_doctor_id_healthcare_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."healthcare_doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_payroll_records" ADD CONSTRAINT "doctor_payroll_records_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_payroll_records" ADD CONSTRAINT "doctor_payroll_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_visits" ADD CONSTRAINT "doctor_visits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_visits" ADD CONSTRAINT "doctor_visits_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_invitations" ADD CONSTRAINT "employee_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_invitations" ADD CONSTRAINT "employee_invitations_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_invitations" ADD CONSTRAINT "employee_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_invitations" ADD CONSTRAINT "employee_invitations_accepted_user_id_users_id_fk" FOREIGN KEY ("accepted_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_approvals" ADD CONSTRAINT "expense_approvals_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_approvals" ADD CONSTRAINT "expense_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_sheets" ADD CONSTRAINT "expense_sheets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_sheets" ADD CONSTRAINT "expense_sheets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_sheets" ADD CONSTRAINT "expense_sheets_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expiry_predictions" ADD CONSTRAINT "expiry_predictions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expiry_predictions" ADD CONSTRAINT "expiry_predictions_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expiry_predictions" ADD CONSTRAINT "expiry_predictions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healthcare_doctors" ADD CONSTRAINT "healthcare_doctors_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healthcare_doctors" ADD CONSTRAINT "healthcare_doctors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healthcare_facilities" ADD CONSTRAINT "healthcare_facilities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospital_departments" ADD CONSTRAINT "hospital_departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospital_doctor_associations" ADD CONSTRAINT "hospital_doctor_associations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospital_doctor_associations" ADD CONSTRAINT "hospital_doctor_associations_doctor_user_id_users_id_fk" FOREIGN KEY ("doctor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospital_doctor_associations" ADD CONSTRAINT "hospital_doctor_associations_department_id_hospital_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."hospital_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intelligence_data" ADD CONSTRAINT "intelligence_data_source_id_intelligence_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."intelligence_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_lab_order_id_lab_orders_id_fk" FOREIGN KEY ("lab_order_id") REFERENCES "public"."lab_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_assigned_technician_id_person_contexts_id_fk" FOREIGN KEY ("assigned_technician_id") REFERENCES "public"."person_contexts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_ordering_organization_id_organizations_id_fk" FOREIGN KEY ("ordering_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_ordering_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("ordering_facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_lab_organization_id_organizations_id_fk" FOREIGN KEY ("lab_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_person_id_persons_id_fk" FOREIGN KEY ("patient_person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_ordering_doctor_context_id_person_contexts_id_fk" FOREIGN KEY ("ordering_doctor_context_id") REFERENCES "public"."person_contexts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_lab_order_id_lab_orders_id_fk" FOREIGN KEY ("lab_order_id") REFERENCES "public"."lab_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_patient_person_id_persons_id_fk" FOREIGN KEY ("patient_person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_generated_by_person_contexts_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."person_contexts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_approved_by_person_contexts_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."person_contexts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_lab_order_item_id_lab_order_items_id_fk" FOREIGN KEY ("lab_order_item_id") REFERENCES "public"."lab_order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_result_entered_by_person_contexts_id_fk" FOREIGN KEY ("result_entered_by") REFERENCES "public"."person_contexts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_verified_by_person_contexts_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."person_contexts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_released_by_users_id_fk" FOREIGN KEY ("released_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_segments" ADD CONSTRAINT "market_segments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicine_stock_ledger" ADD CONSTRAINT "medicine_stock_ledger_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicine_stock_ledger" ADD CONSTRAINT "medicine_stock_ledger_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicine_stock_ledger" ADD CONSTRAINT "medicine_stock_ledger_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mr_performance_insights" ADD CONSTRAINT "mr_performance_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mr_performance_insights" ADD CONSTRAINT "mr_performance_insights_related_doctor_id_doctors_id_fk" FOREIGN KEY ("related_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mr_performance_insights" ADD CONSTRAINT "mr_performance_insights_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mr_profiles" ADD CONSTRAINT "mr_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mr_profiles" ADD CONSTRAINT "mr_profiles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mr_profiles" ADD CONSTRAINT "mr_profiles_reporting_to_users_id_fk" FOREIGN KEY ("reporting_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nl_queries" ADD CONSTRAINT "nl_queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nl_queries" ADD CONSTRAINT "nl_queries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_employees" ADD CONSTRAINT "organization_employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_employees" ADD CONSTRAINT "organization_employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_employees" ADD CONSTRAINT "organization_employees_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_employees" ADD CONSTRAINT "organization_employees_terminated_by_users_id_fk" FOREIGN KEY ("terminated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_employees" ADD CONSTRAINT "organization_employees_reporting_to_users_id_fk" FOREIGN KEY ("reporting_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_modules" ADD CONSTRAINT "organization_modules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_modules" ADD CONSTRAINT "organization_modules_module_id_feature_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."feature_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_organization_type_id_organization_types_id_fk" FOREIGN KEY ("organization_type_id") REFERENCES "public"."organization_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_risk_scores" ADD CONSTRAINT "patient_risk_scores_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_risk_scores" ADD CONSTRAINT "patient_risk_scores_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_risk_scores" ADD CONSTRAINT "patient_risk_scores_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_tracking_numbers" ADD CONSTRAINT "patient_tracking_numbers_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_tracking_numbers" ADD CONSTRAINT "patient_tracking_numbers_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_tracking_numbers" ADD CONSTRAINT "patient_tracking_numbers_doctor_id_healthcare_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."healthcare_doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_vitals" ADD CONSTRAINT "patient_vitals_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_vitals" ADD CONSTRAINT "patient_vitals_queue_entry_id_queue_entries_id_fk" FOREIGN KEY ("queue_entry_id") REFERENCES "public"."queue_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_vitals" ADD CONSTRAINT "patient_vitals_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_queue_entry_id_queue_entries_id_fk" FOREIGN KEY ("queue_entry_id") REFERENCES "public"."queue_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_employee_id_organization_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."organization_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_contexts" ADD CONSTRAINT "person_contexts_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_contexts" ADD CONSTRAINT "person_contexts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_contexts" ADD CONSTRAINT "person_contexts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharma_company_settings" ADD CONSTRAINT "pharma_company_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_kpis" ADD CONSTRAINT "predictive_kpis_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_kpis" ADD CONSTRAINT "predictive_kpis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_kpis" ADD CONSTRAINT "predictive_kpis_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_orders" ADD CONSTRAINT "prescription_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_orders" ADD CONSTRAINT "prescription_orders_patient_person_id_persons_id_fk" FOREIGN KEY ("patient_person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_orders" ADD CONSTRAINT "prescription_orders_prescribing_doctor_context_id_person_contexts_id_fk" FOREIGN KEY ("prescribing_doctor_context_id") REFERENCES "public"."person_contexts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_orders" ADD CONSTRAINT "prescription_orders_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_orders" ADD CONSTRAINT "prescription_orders_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_orders" ADD CONSTRAINT "prescription_orders_dispensed_by_person_contexts_id_fk" FOREIGN KEY ("dispensed_by") REFERENCES "public"."person_contexts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_orders" ADD CONSTRAINT "prescription_orders_queue_token_id_queue_tokens_id_fk" FOREIGN KEY ("queue_token_id") REFERENCES "public"."queue_tokens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_orders" ADD CONSTRAINT "prescription_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_validations" ADD CONSTRAINT "prescription_validations_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_validations" ADD CONSTRAINT "prescription_validations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_validations" ADD CONSTRAINT "prescription_validations_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_healthcare_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."healthcare_doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_samples" ADD CONSTRAINT "product_samples_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_samples" ADD CONSTRAINT "product_samples_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_day_states" ADD CONSTRAINT "queue_day_states_queue_definition_id_queue_definitions_id_fk" FOREIGN KEY ("queue_definition_id") REFERENCES "public"."queue_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_definitions" ADD CONSTRAINT "queue_definitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_definitions" ADD CONSTRAINT "queue_definitions_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_definitions" ADD CONSTRAINT "queue_definitions_doctor_context_id_person_contexts_id_fk" FOREIGN KEY ("doctor_context_id") REFERENCES "public"."person_contexts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_doctor_id_healthcare_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."healthcare_doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_tokens" ADD CONSTRAINT "queue_tokens_queue_day_state_id_queue_day_states_id_fk" FOREIGN KEY ("queue_day_state_id") REFERENCES "public"."queue_day_states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_tokens" ADD CONSTRAINT "queue_tokens_queue_definition_id_queue_definitions_id_fk" FOREIGN KEY ("queue_definition_id") REFERENCES "public"."queue_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_tokens" ADD CONSTRAINT "queue_tokens_patient_person_id_persons_id_fk" FOREIGN KEY ("patient_person_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_tokens" ADD CONSTRAINT "queue_tokens_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_tokens" ADD CONSTRAINT "queue_tokens_called_by_users_id_fk" FOREIGN KEY ("called_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_tokens" ADD CONSTRAINT "queue_tokens_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reorder_suggestions" ADD CONSTRAINT "reorder_suggestions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reorder_suggestions" ADD CONSTRAINT "reorder_suggestions_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reorder_suggestions" ADD CONSTRAINT "reorder_suggestions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_type_id_company_types_id_fk" FOREIGN KEY ("company_type_id") REFERENCES "public"."company_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_plan_stops" ADD CONSTRAINT "route_plan_stops_route_plan_id_route_plans_id_fk" FOREIGN KEY ("route_plan_id") REFERENCES "public"."route_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_plan_stops" ADD CONSTRAINT "route_plan_stops_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_plans" ADD CONSTRAINT "route_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_entries" ADD CONSTRAINT "sales_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_entries" ADD CONSTRAINT "sales_entries_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_entries" ADD CONSTRAINT "sales_entries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_forecasts" ADD CONSTRAINT "sales_forecasts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_forecasts" ADD CONSTRAINT "sales_forecasts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_forecasts" ADD CONSTRAINT "sales_forecasts_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_forecasts" ADD CONSTRAINT "sales_forecasts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_conversion_predictions" ADD CONSTRAINT "sample_conversion_predictions_sample_distribution_id_sample_distributions_id_fk" FOREIGN KEY ("sample_distribution_id") REFERENCES "public"."sample_distributions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_conversion_predictions" ADD CONSTRAINT "sample_conversion_predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_conversion_predictions" ADD CONSTRAINT "sample_conversion_predictions_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_conversion_predictions" ADD CONSTRAINT "sample_conversion_predictions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_distributions" ADD CONSTRAINT "sample_distributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_distributions" ADD CONSTRAINT "sample_distributions_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_distributions" ADD CONSTRAINT "sample_distributions_product_sample_id_product_samples_id_fk" FOREIGN KEY ("product_sample_id") REFERENCES "public"."product_samples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_distributions" ADD CONSTRAINT "sample_distributions_visit_id_doctor_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."doctor_visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_item_id_stock_items_id_fk" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_achievement_alerts" ADD CONSTRAINT "target_achievement_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_achievement_alerts" ADD CONSTRAINT "target_achievement_alerts_related_doctor_id_doctors_id_fk" FOREIGN KEY ("related_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_achievement_alerts" ADD CONSTRAINT "target_achievement_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teleconsult_triages" ADD CONSTRAINT "teleconsult_triages_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teleconsult_triages" ADD CONSTRAINT "teleconsult_triages_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teleconsult_triages" ADD CONSTRAINT "teleconsult_triages_assigned_doctor_id_healthcare_doctors_id_fk" FOREIGN KEY ("assigned_doctor_id") REFERENCES "public"."healthcare_doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_reports" ADD CONSTRAINT "test_reports_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_reports" ADD CONSTRAINT "test_reports_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_reports" ADD CONSTRAINT "test_reports_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_expense_details" ADD CONSTRAINT "travel_expense_details_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_account_type_id_account_types_id_fk" FOREIGN KEY ("account_type_id") REFERENCES "public"."account_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_facility_id_healthcare_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."healthcare_facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "intelligence_data_source_idx" ON "intelligence_data" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "intelligence_data_type_idx" ON "intelligence_data" USING btree ("data_type");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");