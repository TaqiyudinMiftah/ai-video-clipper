import { AppShell } from "@/components/app-shell";
import { VideoSubmitForm } from "@/components/video-submit-form";
import { getDefaultReapClippingConfig } from "@/lib/reap/clipping-config";

export default function NewVideoPage() {
  const initialConfig = getDefaultReapClippingConfig();

  return (
    <AppShell
      eyebrow="New Task"
      title="Add Video"
      description="Submit a URL or upload an MP4, MOV, or WEBM source file, then configure AI clipping settings."
      activeHref="/videos/new"
    >
      <VideoSubmitForm initialConfig={initialConfig} />
    </AppShell>
  );
}
