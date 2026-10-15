import { Link } from "react-router-dom";
import { CONTACT_EMAIL, LegalPage } from "@/components/legal/LegalPage";

const Terms = () => (
  <LegalPage title="Terms of Service" updated="15 October 2026">
    <p>
      These terms are an agreement between you and NourishTrack ("we", "us") about your use of the NourishTrack
      website and app. By creating an account or using NourishTrack, you agree to them. If you don't agree, please
      don't use the service.
    </p>

    <h2>Not medical advice</h2>
    <p>
      NourishTrack helps you track what you eat and set nutrition goals. The calorie and macro targets, food
      information and meal suggestions are <strong>general estimates</strong>, not medical, dietary or professional
      advice. Talk to a doctor or registered dietitian before making significant changes to your diet, especially
      if you are pregnant or breastfeeding, have a medical condition, have a history of disordered eating, or are
      under 18.
    </p>

    <h2>Your account</h2>
    <ul>
      <li>You must be at least 13 years old to use NourishTrack.</li>
      <li>Please give accurate information and keep your sign-in details secure.</li>
      <li>You're responsible for what happens under your account.</li>
    </ul>

    <h2>Using NourishTrack</h2>
    <p>You agree not to:</p>
    <ul>
      <li>break the law or anyone else's rights while using the service;</li>
      <li>try to access other people's accounts or data, or interfere with how the service works;</li>
      <li>copy, scrape or resell the service or its content without our permission.</li>
    </ul>

    <h2>Food and recipe information</h2>
    <p>
      Nutrition data comes from public databases, third-party recipe services and what users enter themselves. We
      try to keep it useful, but we can't guarantee it is complete or accurate. Check labels and ingredients,
      especially if you have allergies or intolerances.
    </p>

    <h2>Your data</h2>
    <p>
      The information you enter stays yours. You allow us to store and process it to run NourishTrack for you, as
      described in our <Link to="/privacy">Privacy Policy</Link>.
    </p>

    <h2>Changes and availability</h2>
    <p>
      We may update, change or stop parts of NourishTrack. We aim to keep it running smoothly but can't promise it
      will always be available or error-free. If we change these terms in an important way, we'll update the date
      above and let you know where appropriate.
    </p>

    <h2>Ending your account</h2>
    <p>
      You can stop using NourishTrack at any time and ask us to delete your account by emailing{" "}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We may suspend accounts that break these terms.
    </p>

    <h2>Limitation of liability</h2>
    <p>
      NourishTrack is provided "as is". As far as the law allows, we are not liable for indirect or consequential
      losses, or for decisions you make based on information in the app. Nothing in these terms limits rights you
      have under consumer protection laws that can't be excluded.
    </p>

    <h2>Contact</h2>
    <p>
      Questions about these terms? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
    </p>
  </LegalPage>
);

export default Terms;
