export type Deity = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export type Hall = {
  id: string;
  name: string;
  description: string;
  deities: Deity[];
  visualTheme: string;
};

export const HALLS: Hall[] = [
  {
    id: "khai-trien",
    name: "Điện Vạn Sự Khai Triển",
    description: "Cầu build xanh, deploy mượt, domain ổn định",
    visualTheme: "from-amber-900/40 via-[#181615] to-black",
    deities: [
      { id: "vercel", name: "Thần Vercel", icon: "▲", description: "Độ trì Frontend Deployment" },
      { id: "netlify", name: "Thần Netlify", icon: "N", description: "Độ trì CI/CD & CDN" },
      { id: "cloudflare", name: "Thần Cloudflare", icon: "☁️", description: "Độ trì DNS & Edge" }
    ]
  },
  {
    id: "hop-nhat",
    name: "Điện Hợp Nhất Vạn Nhánh",
    description: "Cầu merge PR không conflict, CI/CD passed",
    visualTheme: "from-purple-900/40 via-[#181615] to-black",
    deities: [
      { id: "github", name: "Thần GitHub", icon: "🐙", description: "Chủ quản mã nguồn" },
      { id: "gitlab", name: "Thần GitLab", icon: "🦊", description: "Chủ quản pipeline" },
      { id: "bitbucket", name: "Thần Bitbucket", icon: "🪣", description: "Chủ quản repo doanh nghiệp" }
    ]
  },
  {
    id: "tri-tue",
    name: "Điện Trí Tuệ Vạn Lời",
    description: "Cầu prompt sắc bén, JSON hợp lệ, model thông minh",
    visualTheme: "from-emerald-900/40 via-[#181615] to-black",
    deities: [
      { id: "openai", name: "Thần OpenAI", icon: "🧠", description: "Khai mở tư duy LLM" },
      { id: "claude", name: "Thần Claude", icon: "🤖", description: "Tường minh ngữ cảnh" },
      { id: "gemini", name: "Thần Gemini", icon: "✨", description: "Soi sáng đa phương tiện" }
    ]
  },
  {
    id: "du-hai",
    name: "Điện Dữ Hải Trường Tồn",
    description: "Cầu migration mượt, auth bảo mật, realtime không rớt",
    visualTheme: "from-blue-900/40 via-[#181615] to-black",
    deities: [
      { id: "supabase", name: "Thần Supabase", icon: "⚡", description: "Bảo hộ Database & Auth" },
      { id: "firebase", name: "Thần Firebase", icon: "🔥", description: "Bảo hộ Realtime & NoSQL" },
      { id: "postgresql", name: "Thần PostgreSQL", icon: "🐘", description: "Chân linh Dữ liệu lõi" }
    ]
  },
  {
    id: "thien-van",
    name: "Điện Thiên Vân Vạn Tượng",
    description: "Cầu hạ tầng vững chãi, server không sập",
    visualTheme: "from-sky-900/40 via-[#181615] to-black",
    deities: [
      { id: "aws", name: "Thần AWS", icon: "☁️", description: "Thống lĩnh Đám Mây" },
      { id: "gcp", name: "Thần Google Cloud", icon: "🌐", description: "Thống lĩnh Mạng Lưới" },
      { id: "azure", name: "Thần Azure", icon: "A", description: "Thống lĩnh Doanh Nghiệp" }
    ]
  },
  {
    id: "minh-giam",
    name: "Điện Minh Giám Vạn Log",
    description: "Cầu hệ thống không incident, zero bug",
    visualTheme: "from-red-900/40 via-[#181615] to-black",
    deities: [
      { id: "sentry", name: "Thần Sentry", icon: "👁️", description: "Giám sát Lỗi lầm" },
      { id: "datadog", name: "Thần Datadog", icon: "🐕", description: "Giám sát Hạ tầng" },
      { id: "grafana", name: "Thần Grafana", icon: "📊", description: "Giám sát Chỉ số" }
    ]
  }
];
