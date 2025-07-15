create schema if not exists "api";


drop trigger if exists "update_global_workers_updated_at" on "public"."global_workers";

drop policy "Allow users to create billing_periods for themselves" on "public"."billing_periods";

drop policy "Allow users to delete their own billing_periods" on "public"."billing_periods";

drop policy "Allow users to see their own billing_periods" on "public"."billing_periods";

drop policy "Allow users to update their own billing_periods" on "public"."billing_periods";

drop policy "Users can create their own global workers" on "public"."global_workers";

drop policy "Users can delete their own global workers" on "public"."global_workers";

drop policy "Users can update their own global workers" on "public"."global_workers";

drop policy "Users can view their own global workers" on "public"."global_workers";

drop policy "Allow users to create groups for themselves" on "public"."groups";

drop policy "Allow users to delete their own groups" on "public"."groups";

drop policy "Allow users to see their own groups" on "public"."groups";

drop policy "Allow users to update their own groups" on "public"."groups";

drop policy "Users can create their worker assignments" on "public"."worker_period_assignments";

drop policy "Users can delete their worker assignments" on "public"."worker_period_assignments";

drop policy "Users can view their worker assignments" on "public"."worker_period_assignments";

drop policy "Users can create hospedaje for their workers" on "public"."worker_hospedaje";

drop policy "Users can delete hospedaje for their workers" on "public"."worker_hospedaje";

drop policy "Users can update hospedaje for their workers" on "public"."worker_hospedaje";

drop policy "Users can view their workers' hospedaje" on "public"."worker_hospedaje";

revoke delete on table "public"."global_workers" from "anon";

revoke insert on table "public"."global_workers" from "anon";

revoke references on table "public"."global_workers" from "anon";

revoke select on table "public"."global_workers" from "anon";

revoke trigger on table "public"."global_workers" from "anon";

revoke truncate on table "public"."global_workers" from "anon";

revoke update on table "public"."global_workers" from "anon";

revoke delete on table "public"."global_workers" from "authenticated";

revoke insert on table "public"."global_workers" from "authenticated";

revoke references on table "public"."global_workers" from "authenticated";

revoke select on table "public"."global_workers" from "authenticated";

revoke trigger on table "public"."global_workers" from "authenticated";

revoke truncate on table "public"."global_workers" from "authenticated";

revoke update on table "public"."global_workers" from "authenticated";

revoke delete on table "public"."global_workers" from "service_role";

revoke insert on table "public"."global_workers" from "service_role";

revoke references on table "public"."global_workers" from "service_role";

revoke select on table "public"."global_workers" from "service_role";

revoke trigger on table "public"."global_workers" from "service_role";

revoke truncate on table "public"."global_workers" from "service_role";

revoke update on table "public"."global_workers" from "service_role";

revoke delete on table "public"."groups" from "anon";

revoke insert on table "public"."groups" from "anon";

revoke references on table "public"."groups" from "anon";

revoke select on table "public"."groups" from "anon";

revoke trigger on table "public"."groups" from "anon";

revoke truncate on table "public"."groups" from "anon";

revoke update on table "public"."groups" from "anon";

revoke delete on table "public"."groups" from "authenticated";

revoke insert on table "public"."groups" from "authenticated";

revoke references on table "public"."groups" from "authenticated";

revoke select on table "public"."groups" from "authenticated";

revoke trigger on table "public"."groups" from "authenticated";

revoke truncate on table "public"."groups" from "authenticated";

revoke update on table "public"."groups" from "authenticated";

revoke delete on table "public"."groups" from "service_role";

revoke insert on table "public"."groups" from "service_role";

revoke references on table "public"."groups" from "service_role";

revoke select on table "public"."groups" from "service_role";

revoke trigger on table "public"."groups" from "service_role";

revoke truncate on table "public"."groups" from "service_role";

revoke update on table "public"."groups" from "service_role";

revoke delete on table "public"."worker_period_assignments" from "anon";

revoke insert on table "public"."worker_period_assignments" from "anon";

revoke references on table "public"."worker_period_assignments" from "anon";

revoke select on table "public"."worker_period_assignments" from "anon";

revoke trigger on table "public"."worker_period_assignments" from "anon";

revoke truncate on table "public"."worker_period_assignments" from "anon";

revoke update on table "public"."worker_period_assignments" from "anon";

revoke delete on table "public"."worker_period_assignments" from "authenticated";

revoke insert on table "public"."worker_period_assignments" from "authenticated";

revoke references on table "public"."worker_period_assignments" from "authenticated";

revoke select on table "public"."worker_period_assignments" from "authenticated";

revoke trigger on table "public"."worker_period_assignments" from "authenticated";

revoke truncate on table "public"."worker_period_assignments" from "authenticated";

revoke update on table "public"."worker_period_assignments" from "authenticated";

revoke delete on table "public"."worker_period_assignments" from "service_role";

revoke insert on table "public"."worker_period_assignments" from "service_role";

revoke references on table "public"."worker_period_assignments" from "service_role";

revoke select on table "public"."worker_period_assignments" from "service_role";

revoke trigger on table "public"."worker_period_assignments" from "service_role";

revoke truncate on table "public"."worker_period_assignments" from "service_role";

revoke update on table "public"."worker_period_assignments" from "service_role";

alter table "public"."global_workers" drop constraint "global_workers_user_id_name_position_key";

alter table "public"."groups" drop constraint "groups_billing_period_id_fkey";

alter table "public"."groups" drop constraint "groups_user_id_fkey";

alter table "public"."worker_period_assignments" drop constraint "worker_period_assignments_billing_period_id_fkey";

alter table "public"."worker_period_assignments" drop constraint "worker_period_assignments_worker_id_billing_period_id_key";

alter table "public"."worker_period_assignments" drop constraint "worker_period_assignments_worker_id_fkey";

alter table "public"."workers" drop constraint "workers_group_id_fkey";

alter table "public"."worker_hospedaje" drop constraint "worker_hospedaje_worker_id_fkey";

alter table "public"."global_workers" drop constraint "global_workers_pkey";

alter table "public"."groups" drop constraint "groups_pkey";

alter table "public"."worker_period_assignments" drop constraint "worker_period_assignments_pkey";

drop index if exists "public"."global_workers_pkey";

drop index if exists "public"."global_workers_user_id_name_position_key";

drop index if exists "public"."groups_pkey";

drop index if exists "public"."worker_period_assignments_pkey";

drop index if exists "public"."worker_period_assignments_worker_id_billing_period_id_key";

drop table "public"."global_workers";

drop table "public"."groups";

drop table "public"."worker_period_assignments";

alter table "public"."workers" drop column "group_id";

alter table "public"."worker_hospedaje" add constraint "worker_hospedaje_worker_id_fkey" FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE not valid;

alter table "public"."worker_hospedaje" validate constraint "worker_hospedaje_worker_id_fkey";

create policy "Users can create hospedaje for their workers"
on "public"."worker_hospedaje"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM workers
  WHERE ((workers.id = worker_hospedaje.worker_id) AND (workers.user_id = auth.uid())))));


create policy "Users can delete hospedaje for their workers"
on "public"."worker_hospedaje"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM workers
  WHERE ((workers.id = worker_hospedaje.worker_id) AND (workers.user_id = auth.uid())))));


create policy "Users can update hospedaje for their workers"
on "public"."worker_hospedaje"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM workers
  WHERE ((workers.id = worker_hospedaje.worker_id) AND (workers.user_id = auth.uid())))));


create policy "Users can view their workers' hospedaje"
on "public"."worker_hospedaje"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM workers
  WHERE ((workers.id = worker_hospedaje.worker_id) AND (workers.user_id = auth.uid())))));



