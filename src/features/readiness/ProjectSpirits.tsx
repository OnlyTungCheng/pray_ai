"use client";
import Image from "next/image";
import type { ProjectReadinessSnapshot } from "./types";
type Props = { readiness: ProjectReadinessSnapshot | null; themeMode: "basic" | "remix" };
const spirits = [{ id: "build", src: "/project-spirits-v1/build-spirit.png", label: "Build spirit" }, { id: "guardian", src: "/project-spirits-v1/guardian-spirit.png", label: "Guardian spirit" }, { id: "launch", src: "/project-spirits-v1/launch-spirit.png", label: "Launch spirit" }];
export default function ProjectSpirits({ readiness, themeMode }: Props) {
  const mood = readiness?.verdict ?? "blocked";
  return <div className={`project-spirits project-spirits-${mood} ${themeMode === "remix" ? "project-spirits-remix" : ""}`} aria-label="Project spirits">
    {spirits.map((spirit) => <div key={spirit.id} className={`project-spirit project-spirit-${spirit.id}`}><span className="project-spirit-motion"><Image src={spirit.src} alt={spirit.label} width={180} height={180} /></span></div>)}
  </div>;
}
