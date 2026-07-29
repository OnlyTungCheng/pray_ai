// Hardcoded per-Hall content: Loại nghi lễ (ritual types) + Cơ chế cúng
// dường (offering/action catalog), per docs/than.md §2-3 — following the
// same product decision as deity-catalog.ts ("hardcode là được"). Not
// DB-backed: a future UI reads these by `hallSlug` alongside the DB-backed
// Hall row (hall-catalog-service.ts), so switching a room's hall_id also
// switches which content applies, with no separate content-switch step.
//
// Each entry has its own `id` for tracing/debugging (e.g. logging "user
// triggered hall_offering hall_offer_khai_trien_preview") and an
// `imageKey` placeholder — no real art exists yet.

export interface HallRitual {
  id: string;
  hallSlug: string;
  slug: string;
  name: string;
  description: string;
  imageKey: string | null;
  sortOrder: number;
}

export interface HallOffering {
  id: string;
  hallSlug: string;
  slug: string;
  name: string;
  description: string;
  imageKey: string | null;
  sortOrder: number;
}

export const HALL_RITUALS: HallRitual[] = [
  // Điện Vạn Sự Khai Triển
  { id: 'ritual_khai_trien_build', hallSlug: 'khai-trien', slug: 'build_production', name: 'Build production', description: 'Nghi lễ build bản production.', imageKey: null, sortOrder: 1 },
  { id: 'ritual_khai_trien_deploy', hallSlug: 'khai-trien', slug: 'deploy_release', name: 'Deploy release', description: 'Nghi lễ deploy bản release.', imageKey: null, sortOrder: 2 },
  { id: 'ritual_khai_trien_preview', hallSlug: 'khai-trien', slug: 'preview_deployment', name: 'Preview deployment', description: 'Nghi lễ deploy bản preview.', imageKey: null, sortOrder: 3 },
  { id: 'ritual_khai_trien_domain', hallSlug: 'khai-trien', slug: 'domain_cutover', name: 'Domain cutover', description: 'Nghi lễ chuyển domain.', imageKey: null, sortOrder: 4 },

  // Điện Hợp Nhất Vạn Nhánh
  { id: 'ritual_hop_nhat_commit', hallSlug: 'hop-nhat', slug: 'commit', name: 'Commit', description: 'Nghi lễ dâng commit.', imageKey: null, sortOrder: 1 },
  { id: 'ritual_hop_nhat_pr', hallSlug: 'hop-nhat', slug: 'pull_request', name: 'Pull request', description: 'Nghi lễ xin approve pull request.', imageKey: null, sortOrder: 2 },
  { id: 'ritual_hop_nhat_review', hallSlug: 'hop-nhat', slug: 'review', name: 'Review', description: 'Nghi lễ soi diff.', imageKey: null, sortOrder: 3 },
  { id: 'ritual_hop_nhat_merge', hallSlug: 'hop-nhat', slug: 'merge', name: 'Merge', description: 'Nghi lễ hợp nhất nhánh.', imageKey: null, sortOrder: 4 },

  // Điện Dữ Hải Trường Tồn
  { id: 'ritual_du_hai_migration', hallSlug: 'du-hai', slug: 'migration', name: 'Migration', description: 'Nghi lễ chạy migration.', imageKey: null, sortOrder: 1 },
  { id: 'ritual_du_hai_database', hallSlug: 'du-hai', slug: 'database', name: 'Database', description: 'Nghi lễ thao tác database.', imageKey: null, sortOrder: 2 },
  { id: 'ritual_du_hai_auth', hallSlug: 'du-hai', slug: 'auth', name: 'Auth', description: 'Nghi lễ khai cấu hình auth.', imageKey: null, sortOrder: 3 },
  { id: 'ritual_du_hai_realtime', hallSlug: 'du-hai', slug: 'realtime', name: 'Realtime', description: 'Nghi lễ mở kênh realtime.', imageKey: null, sortOrder: 4 },

  // Điện Trí Tuệ Vạn Lời
  { id: 'ritual_tri_tue_prompt', hallSlug: 'tri-tue', slug: 'prompt', name: 'Prompt', description: 'Nghi lễ dâng prompt rõ ràng.', imageKey: null, sortOrder: 1 },
  { id: 'ritual_tri_tue_context', hallSlug: 'tri-tue', slug: 'context', name: 'Context', description: 'Nghi lễ nạp context cần thiết.', imageKey: null, sortOrder: 2 },
  { id: 'ritual_tri_tue_tool', hallSlug: 'tri-tue', slug: 'tool_calling', name: 'Tool calling', description: 'Nghi lễ gọi đúng công cụ.', imageKey: null, sortOrder: 3 },
  { id: 'ritual_tri_tue_output', hallSlug: 'tri-tue', slug: 'structured_output', name: 'Structured output', description: 'Nghi lễ xin output đúng schema.', imageKey: null, sortOrder: 4 },

  // Điện Thiên Vân Vạn Tượng
  { id: 'ritual_thien_van_compute', hallSlug: 'thien-van', slug: 'compute', name: 'Compute', description: 'Nghi lễ dựng tài nguyên compute.', imageKey: null, sortOrder: 1 },
  { id: 'ritual_thien_van_storage', hallSlug: 'thien-van', slug: 'storage', name: 'Storage', description: 'Nghi lễ bảo toàn storage.', imageKey: null, sortOrder: 2 },
  { id: 'ritual_thien_van_network', hallSlug: 'thien-van', slug: 'networking', name: 'Networking', description: 'Nghi lễ khai thông network.', imageKey: null, sortOrder: 3 },
  { id: 'ritual_thien_van_scaling', hallSlug: 'thien-van', slug: 'autoscaling', name: 'Autoscaling', description: 'Nghi lễ mở autoscaling.', imageKey: null, sortOrder: 4 },

  // Điện Minh Giám Vạn Log
  { id: 'ritual_minh_giam_error', hallSlug: 'minh-giam', slug: 'error_tracking', name: 'Error tracking', description: 'Nghi lễ soi lỗi và stack trace.', imageKey: null, sortOrder: 1 },
  { id: 'ritual_minh_giam_monitor', hallSlug: 'minh-giam', slug: 'monitoring', name: 'Monitoring', description: 'Nghi lễ giám sát hệ thống.', imageKey: null, sortOrder: 2 },
  { id: 'ritual_minh_giam_alert', hallSlug: 'minh-giam', slug: 'alert', name: 'Alert', description: 'Nghi lễ điều phục cảnh báo.', imageKey: null, sortOrder: 3 },
  { id: 'ritual_minh_giam_incident', hallSlug: 'minh-giam', slug: 'incident', name: 'Incident', description: 'Nghi lễ hóa giải incident.', imageKey: null, sortOrder: 4 }
];

export const HALL_OFFERINGS: HallOffering[] = [
  // Điện Vạn Sự Khai Triển
  { id: 'hall_offer_khai_trien_preview', hallSlug: 'khai-trien', slug: 'dang_preview', name: 'Dâng Preview', description: 'Dâng 1 bản preview deployment.', imageKey: null, sortOrder: 1 },
  { id: 'hall_offer_khai_trien_env_check', hallSlug: 'khai-trien', slug: 'kiem_tra_environment', name: 'Kiểm tra environment', description: 'Kiểm tra biến môi trường trước khi deploy.', imageKey: null, sortOrder: 2 },
  { id: 'hall_offer_khai_trien_open_prod', hallSlug: 'khai-trien', slug: 'mo_cong_production', name: 'Mở cổng Production', description: 'Mở cổng chạy production.', imageKey: null, sortOrder: 3 },
  { id: 'hall_offer_khai_trien_domain', hallSlug: 'khai-trien', slug: 'cau_domain_propagation', name: 'Cầu domain propagation', description: 'Cầu cho domain propagate nhanh, không lỗi DNS.', imageKey: null, sortOrder: 4 },

  // Điện Hợp Nhất Vạn Nhánh
  { id: 'hall_offer_hop_nhat_commit', hallSlug: 'hop-nhat', slug: 'dang_commit', name: 'Dâng commit', description: 'Dâng 1 commit lên nghi lễ.', imageKey: null, sortOrder: 1 },
  { id: 'hall_offer_hop_nhat_approve', hallSlug: 'hop-nhat', slug: 'xin_approve', name: 'Xin approve', description: 'Cầu xin được approve pull request.', imageKey: null, sortOrder: 2 },
  { id: 'hall_offer_hop_nhat_diff', hallSlug: 'hop-nhat', slug: 'soi_diff', name: 'Soi diff', description: 'Soi lại diff trước khi merge.', imageKey: null, sortOrder: 3 },
  { id: 'hall_offer_hop_nhat_conflict', hallSlug: 'hop-nhat', slug: 'giai_merge_conflict', name: 'Giải merge conflict', description: 'Cầu giải merge conflict êm đẹp.', imageKey: null, sortOrder: 4 },

  // Điện Dữ Hải Trường Tồn
  { id: 'hall_offer_du_hai_schema', hallSlug: 'du-hai', slug: 'dang_schema', name: 'Dâng schema', description: 'Dâng schema migration mới.', imageKey: null, sortOrder: 1 },
  { id: 'hall_offer_du_hai_rls', hallSlug: 'du-hai', slug: 'ban_rls', name: 'Ban RLS', description: 'Cầu RLS policy đúng, không lộ dữ liệu.', imageKey: null, sortOrder: 2 },
  { id: 'hall_offer_du_hai_realtime', hallSlug: 'du-hai', slug: 'mo_realtime', name: 'Mở realtime', description: 'Cầu kênh realtime không rớt.', imageKey: null, sortOrder: 3 },
  { id: 'hall_offer_du_hai_backup', hallSlug: 'du-hai', slug: 'sao_luu_du_lieu', name: 'Sao lưu dữ liệu', description: 'Cầu backup dữ liệu an toàn trước khi migration.', imageKey: null, sortOrder: 4 },

  // Điện Trí Tuệ Vạn Lời
  { id: 'hall_offer_tri_tue_prompt', hallSlug: 'tri-tue', slug: 'dang_prompt', name: 'Dâng prompt', description: 'Dâng prompt đã được làm rõ.', imageKey: null, sortOrder: 1 },
  { id: 'hall_offer_tri_tue_context', hallSlug: 'tri-tue', slug: 'nap_context', name: 'Nạp context', description: 'Nạp context vừa đủ cho lời giải.', imageKey: null, sortOrder: 2 },
  { id: 'hall_offer_tri_tue_schema', hallSlug: 'tri-tue', slug: 'khai_schema', name: 'Khai schema', description: 'Khai schema đầu ra mong muốn.', imageKey: null, sortOrder: 3 },
  { id: 'hall_offer_tri_tue_tool', hallSlug: 'tri-tue', slug: 'goi_tool', name: 'Gọi tool', description: 'Cầu gọi đúng tool và đúng tham số.', imageKey: null, sortOrder: 4 },

  // Điện Thiên Vân Vạn Tượng
  { id: 'hall_offer_thien_van_region', hallSlug: 'thien-van', slug: 'chon_region', name: 'Chọn region', description: 'Dâng lựa chọn region phù hợp.', imageKey: null, sortOrder: 1 },
  { id: 'hall_offer_thien_van_resource', hallSlug: 'thien-van', slug: 'dung_tai_nguyen', name: 'Dựng tài nguyên', description: 'Dựng tài nguyên cloud cần thiết.', imageKey: null, sortOrder: 2 },
  { id: 'hall_offer_thien_van_iam', hallSlug: 'thien-van', slug: 'cap_iam', name: 'Cấp IAM', description: 'Cầu quyền IAM tối thiểu và chính xác.', imageKey: null, sortOrder: 3 },
  { id: 'hall_offer_thien_van_scaling', hallSlug: 'thien-van', slug: 'mo_autoscaling', name: 'Mở autoscaling', description: 'Cầu hệ thống co giãn ổn định.', imageKey: null, sortOrder: 4 },

  // Điện Minh Giám Vạn Log
  { id: 'hall_offer_minh_giam_trace', hallSlug: 'minh-giam', slug: 'dang_stack_trace', name: 'Dâng stack trace', description: 'Dâng stack trace để soi căn nguyên.', imageKey: null, sortOrder: 1 },
  { id: 'hall_offer_minh_giam_error', hallSlug: 'minh-giam', slug: 'soi_loi', name: 'Soi lỗi', description: 'Soi lỗi trước khi thành incident.', imageKey: null, sortOrder: 2 },
  { id: 'hall_offer_minh_giam_dashboard', hallSlug: 'minh-giam', slug: 'mo_dashboard', name: 'Mở dashboard', description: 'Mở dashboard quan sát toàn cục.', imageKey: null, sortOrder: 3 },
  { id: 'hall_offer_minh_giam_alert', hallSlug: 'minh-giam', slug: 'trieu_hoi_alert', name: 'Triệu hồi alert', description: 'Kiểm tra đường cảnh báo hoạt động.', imageKey: null, sortOrder: 4 }
];

export function getRitualsForHall(hallSlug: string): HallRitual[] {
  return HALL_RITUALS.filter((r) => r.hallSlug === hallSlug).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getOfferingsForHall(hallSlug: string): HallOffering[] {
  return HALL_OFFERINGS.filter((o) => o.hallSlug === hallSlug).sort((a, b) => a.sortOrder - b.sortOrder);
}
