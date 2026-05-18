import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Clips Automation",
  description: "Terms of Service for Clips Automation.",
};

const lastUpdated = "May 18, 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 leading-7">
      <Link href="/" className="text-sm font-black uppercase tracking-[0.22em] text-[color:var(--ember)]">
        Clips Automation
      </Link>
      <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] md:text-6xl">Terms of Service</h1>
      <p className="mt-4 text-[color:var(--muted)]">Last updated: {lastUpdated}</p>

      <section className="mt-10 grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[0_24px_80px_rgba(30,26,21,0.08)]">
        <p>
          These Terms of Service govern access to and use of Clips Automation, an MVP web application for submitting videos, preparing short clips, and queueing user-directed TikTok upload workflows.
        </p>

        <h2 className="text-2xl font-black tracking-[-0.04em]">Use Of The Service</h2>
        <p>
          You may use the service only for lawful purposes and only with videos, captions, hashtags, and accounts that you own or are authorized to use. You are responsible for ensuring that your content and publishing activity comply with applicable laws and platform rules.
        </p>

        <h2 className="text-2xl font-black tracking-[-0.04em]">User Content</h2>
        <p>
          You retain ownership of content you submit. By submitting content, you grant the app permission to process, store, transform, and transmit that content as needed to perform the requested clipping and upload workflows.
        </p>

        <h2 className="text-2xl font-black tracking-[-0.04em]">Third-Party Platforms</h2>
        <p>
          Clips Automation may interact with services such as OpusClip, Composio, Supabase, and TikTok. Your use of those services is also subject to their separate terms, policies, account requirements, rate limits, and review processes.
        </p>

        <h2 className="text-2xl font-black tracking-[-0.04em]">TikTok Publishing</h2>
        <p>
          TikTok upload functionality is user-directed and requires authorized access. The app does not grant permission to publish content that violates TikTok policies, third-party rights, or applicable law.
        </p>

        <h2 className="text-2xl font-black tracking-[-0.04em]">MVP Availability</h2>
        <p>
          The service is provided as an MVP and may include placeholder integrations, incomplete automation selectors, downtime, data loss, or workflow failures. The service is provided without warranties to the fullest extent permitted by law.
        </p>

        <h2 className="text-2xl font-black tracking-[-0.04em]">Limitation Of Liability</h2>
        <p>
          To the fullest extent permitted by law, the app operator is not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of data, content, revenue, or business opportunities arising from use of the service.
        </p>

        <h2 className="text-2xl font-black tracking-[-0.04em]">Changes</h2>
        <p>
          These Terms may be updated as the MVP evolves. Continued use of the service after updates means you accept the revised Terms.
        </p>

        <h2 className="text-2xl font-black tracking-[-0.04em]">Contact</h2>
        <p>
          For questions about these Terms, contact the operator of the TikTok developer account associated with this application.
        </p>
      </section>
    </main>
  );
}
