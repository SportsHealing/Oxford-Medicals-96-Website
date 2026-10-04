export default function Privacy() {
  return (
    <div className="mx-auto max-w-prose space-y-6">
      <h1 className="text-4xl">Privacy</h1>
      <p className="text-gray-700">
        This site exists for one group of people: Oxford medics who graduated in 1996. Here is what
        we hold, why, and what you can do about it.
      </p>

      <Section title="Who can see what">
        <li>Only signed-in members can see photos, profiles and tags.</li>
        <li>The public sees this page and the front page. Nothing else.</li>
        <li>Search engines are asked not to index the site.</li>
      </Section>

      <Section title="What we hold about you">
        <li>Your name, college and the answers you gave in the questionnaire.</li>
        <li>Your email address, used to sign you in and to pass on contact requests.</li>
        <li>Photos you appear in, and tags that say you are in them.</li>
      </Section>

      <Section title="Tags">
        <li>Anyone can suggest that you are in a photo.</li>
        <li>The tag is shown to other members only after you confirm it.</li>
        <li>You can remove a tag of yourself at any time.</li>
        <li>You can also ask for a photo of you to be taken down.</li>
      </Section>

      <Section title="Face matching">
        <li>We do not use face recognition at present.</li>
        <li>If we ever do, it will only suggest tags, never publish them, and only for members who have opted in.</li>
        <li>Facial data is special category data under UK GDPR. We will ask for your explicit consent first and complete an impact assessment.</li>
      </Section>

      <Section title="Contact requests">
        <li>When you message a classmate, they get your message and your email address.</li>
        <li>Their email address is never shown to you unless they reply.</li>
        <li>Anyone can switch off contact requests on their profile.</li>
      </Section>

      <Section title="Your rights">
        <li>See, change or delete your own profile at any time.</li>
        <li>Ask for a copy of everything we hold about you.</li>
        <li>Leave the site and have your data removed.</li>
      </Section>

      <p className="font-sans text-sm text-gray-600">
        Questions go to the site organisers. This notice will be finalised before real photos and
        profiles go live.
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">{children}</ul>
    </section>
  )
}
