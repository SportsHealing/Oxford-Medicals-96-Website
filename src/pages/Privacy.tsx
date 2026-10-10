import PageHeader from '../components/PageHeader.tsx'

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Your data"
        title="Privacy"
        lede="This site exists for one group of people. Here is what we hold, why, and what you can do about it."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Section title="Who can see what">
          <li>Only signed-in members see photos, profiles and tags.</li>
          <li>The public sees the front page and this page. Nothing else. The front page shows one class photo.</li>
          <li>Search engines are asked not to index the site.</li>
        </Section>

        <Section title="What we hold about you">
          <li>Your name, college and the answers you gave in the questionnaire.</li>
          <li>Your email address, used to sign you in and to pass on messages.</li>
          <li>Photos you appear in, and tags that say you are in them.</li>
          <li>If you add them: your specialty, your name at medical school, your town (shown on your profile and the classmates map) and links to your public pages.</li>
        </Section>

        <Section title="Joining">
          <li>The organisers keep a class list of names, with email addresses where known, so classmates can join.</li>
          <li>If you ask to join and are not on the list, only the organisers see your name and email, to decide.</li>
          <li>If a request is declined we keep only that request, so you are not asked again. Ask us to delete it at any time.</li>
        </Section>

        <Section title="Tags">
          <li>Anyone can suggest that you are in a photo.</li>
          <li>The tag is shown to others only after you confirm it.</li>
          <li>You can remove a tag of yourself at any time.</li>
          <li>You can ask for a photo of you to be taken down.</li>
        </Section>

        <Section title="Face matching">
          <li>We do not use face recognition at present.</li>
          <li>If we ever do, it will only suggest tags, never publish them, and only for members who opt in.</li>
          <li>Facial data is special category data under UK GDPR. We will ask for explicit consent first.</li>
        </Section>

        <Section title="Messages">
          <li>When you message a classmate, they get your message and your email address.</li>
          <li>Their address is never shown to you unless they reply, or they chose to show it on their profile.</li>
          <li>Showing your email to classmates is off unless you turn it on, on your Me page.</li>
          <li>Anyone can switch off messages on their profile.</li>
        </Section>

        <Section title="Your rights">
          <li>See, change or delete your own profile at any time.</li>
          <li>Ask for a copy of everything we hold about you.</li>
          <li>Leave the site and have your data removed.</li>
        </Section>
      </div>

      <p className="mt-8 font-sans text-sm text-muted">
        Questions go to the site organisers. This notice will be finalised before real photos and
        profiles go live.
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="text-xl">{title}</h2>
      <ul className="mt-3 space-y-2 text-[0.95rem] text-muted">{children}</ul>
    </section>
  )
}
