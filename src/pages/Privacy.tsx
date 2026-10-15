import { Link } from "react-router-dom";
import { CONTACT_EMAIL, LegalPage } from "@/components/legal/LegalPage";

const Privacy = () => (
  <LegalPage title="Privacy Policy" updated="15 October 2026">
    <p>
      This policy explains what information NourishTrack ("we", "us") collects when you use the NourishTrack
      website and app, why we collect it, and the choices you have. If you have any questions, email us at{" "}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
    </p>

    <h2>What we collect</h2>
    <ul>
      <li>
        <strong>Account details:</strong> your email address. If you sign in with Google, we also receive your name
        and profile picture from Google. We never see your Google password.
      </li>
      <li>
        <strong>Profile and goals:</strong> information you choose to enter, such as your name, age, sex, height,
        weight, activity level, weight goal, daily calorie and macro targets, dietary preferences and preferred
        units.
      </li>
      <li>
        <strong>Your tracking data:</strong> the foods and meals you log, the weights you record, and the meal
        suggestions you save.
      </li>
      <li>
        <strong>Messages you send us,</strong> for example when you email us for support.
      </li>
    </ul>
    <p>
      Some of this, such as your weight and diet, is information about your health. We only use it to provide
      NourishTrack's features to you.
    </p>

    <h2>How we use it</h2>
    <ul>
      <li>To create and secure your account and keep you signed in.</li>
      <li>To calculate your daily targets, show your food diary, dashboard and progress, and save your data.</li>
      <li>To generate meal suggestions that fit your goals and dietary preferences.</li>
      <li>To answer your questions and fix problems.</li>
    </ul>
    <p>
      We do <strong>not</strong> sell your information, use it for advertising, or share it with anyone for their
      own marketing.
    </p>

    <h2>Services we rely on</h2>
    <p>We use a small number of trusted providers to run NourishTrack. They only process data to provide their service to us:</p>
    <ul>
      <li>
        <strong>Supabase</strong> stores your account and the data you enter, and handles sign-in.
      </li>
      <li>
        <strong>Vercel</strong> hosts the website and provides privacy-friendly visitor statistics (which pages are
        visited, from what kind of device and roughly which country). It doesn't use cookies or identify you.
      </li>
      <li>
        <strong>Google</strong> handles "Continue with Google" sign-in, if you choose to use it.
      </li>
      <li>
        <strong>USDA FoodData Central</strong> receives the words you type into food search, to return matching
        foods. It does not receive your name or account details.
      </li>
      <li>
        <strong>Open Food Facts</strong> receives the barcode number when you scan or type one, to look up the
        product. If you use the camera to scan, the image is processed on your device and never uploaded.
      </li>
      <li>
        <strong>Spoonacular</strong> receives your meal type, calorie and macro targets and dietary preferences
        when you generate meal suggestions. It does not receive your name or email.
      </li>
    </ul>
    <p>These providers may process data in countries other than your own.</p>

    <h2>Cookies and browser storage</h2>
    <p>
      We don't use advertising or tracking cookies. We store a few small items in your browser to keep you signed
      in, remember your preferred units, and remember if you skipped the setup for this visit.
    </p>

    <h2>Who can see your data</h2>
    <p>
      Your food diary, weight, goals and saved meals are tied to your account, and our database is set up so that
      other users cannot read them.
    </p>

    <h2>How long we keep it</h2>
    <p>
      We keep your information while your account is open. If you ask us to delete your account, we delete your
      account and the data linked to it, except anything we are required by law to keep.
    </p>

    <h2>Your choices and rights</h2>
    <ul>
      <li>You can view and change your profile and goals at any time in the app.</li>
      <li>You can delete individual foods and saved meals in the app.</li>
      <li>
        You can delete your account and all its data yourself at any time in Profile → Delete account.
      </li>
      <li>
        You can ask for a copy of your data, ask us to correct it, or ask us to delete your account by emailing{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address on your account. We'll respond
        within 30 days.
      </li>
      <li>
        Depending on where you live, you may also have the right to object to or restrict how we use your data, and
        to complain to your local data protection authority.
      </li>
    </ul>

    <h2>Children</h2>
    <p>
      NourishTrack is not meant for children under 13, and we don't knowingly collect their information. If you
      believe a child has created an account, contact us and we'll delete it.
    </p>

    <h2>Security</h2>
    <p>
      Data is sent over encrypted connections and stored with access controls. No online service can be perfectly
      secure, but we work to protect your information.
    </p>

    <h2>Changes to this policy</h2>
    <p>
      If we make important changes, we'll update the date at the top of this page and, where appropriate, let you
      know in the app.
    </p>

    <p>
      See also our <Link to="/terms">Terms of Service</Link>.
    </p>
  </LegalPage>
);

export default Privacy;
