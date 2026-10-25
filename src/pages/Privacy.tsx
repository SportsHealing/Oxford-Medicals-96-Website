import PageHeader from '../components/PageHeader.tsx'

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Your data" title="Privacy" lede="This site exists for one group of people. Here is what it holds, how it is protected, and what you can ask for." />

      <div className="grid gap-5 sm:grid-cols-2">
        <Section title="Who can see what">
          <li>Anyone can see this front page, the two class photos on it, and this notice.</li>
          <li>The photo archive, the speeches and the map open only with the class code shared within the year group.</li>
          <li>There are no accounts, passwords or sign-in emails. Search engines are asked not to index the site.</li>
        </Section>

        <Section title="How the code protects things">
          <li>The photos and speeches are stored in scrambled (encrypted) form. The site never stores the code itself: the code is turned into the key that unscrambles them, on your device.</li>
          <li>This keeps the archive from anyone browsing or stumbling on the files. It is not secrecy against a determined attacker with specialist tools, so please keep the code within the class and do not post it publicly.</li>
          <li>If the code ever gets out, the organisers can choose a new one and republish the archive.</li>
          <li>Names and places added to photos are scrambled with the code in your browser before they are saved, so the service that keeps them (Cloudflare) only holds unreadable data.</li>
        </Section>

        <Section title="What the site holds">
          <li>Photos from our time at Oxford and since, with a title and, where known, a year, place and occasion. Location and camera data is removed from each picture.</li>
          <li>Speeches, in their speakers&rsquo; own words, shared with their permission.</li>
          <li>A map of where the class is known to be, showing towns and numbers only.</li>
          <li>Names and places that classmates add to photos. Anyone with the class code can add or correct them, and each photo keeps its last 20 versions so mistakes can be put right.</li>
          <li>No profiles, email addresses or messages are kept.</li>
        </Section>

        <Section title="On your device">
          <li>Once you enter the code, it is remembered on that device so you are not asked again. Press <strong>Lock</strong> at the bottom of any page to forget it, for example on a shared computer.</li>
          <li>Pictures you have looked at are kept on the device in their scrambled form, so they do not have to be downloaded twice. Lock removes them too.</li>
          <li>The site sets no cookies and uses no analytics. Its fonts are loaded from Google Fonts.</li>
        </Section>

        <Section title="Face matching">
          <li>The site does not use face recognition and does not identify anyone in the photos.</li>
        </Section>

        <Section title="Your rights">
          <li>Ask for a photo of you, or a speech, to be taken down, and it will be removed at the next update.</li>
          <li>Correct a name or place on a photo yourself (Edit on the photo&rsquo;s page), or ask the organisers to remove your name from a photo.</li>
          <li>Ask the organisers anything about how the site is run.</li>
        </Section>
      </div>

      <p className="mt-8 font-sans text-sm text-muted">Questions go to the site organisers. Updated October 2026.</p>
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
