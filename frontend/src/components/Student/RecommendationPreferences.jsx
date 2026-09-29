import { useEffect, useState } from 'react';
import { recommendationRequest } from '../../api/recommendations';
import '../../styles/Recommendations.css';

export default function RecommendationPreferences() {
    const [profile, setProfile] = useState({ interestsText: '', aboutText: '', preferredRole: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true); setError('');
        recommendationRequest('/profile').then(data => {
            if (active) { setProfile(data.profile); setLoaded(true); }
        }).catch(err => { if (active) setError(err.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [attempt]);
    const save = async event => {
        event.preventDefault(); setSaving(true); setError(''); setSaved(false);
        try {
            await recommendationRequest('/profile', { method: 'PUT', body: JSON.stringify({
                interestsText: profile.interestsText, aboutText: profile.aboutText, preferredRole: profile.preferredRole,
            }) });
            setSaved(true);
        } catch (err) { setError(err.message); }
        finally { setSaving(false); }
    };
    return <section className="recommendation-card recommendation-preferences" aria-labelledby="preferences-heading">
        <h2 id="preferences-heading">Recommendation preferences</h2>
        <p>Describe your academic interests and preferred project role. These details and your saved skills help match projects.</p>
        {loading && <p role="status">Loading preferences…</p>}
        {error && <p role="alert">{error} {!loaded && <button type="button" onClick={() => setAttempt(n => n + 1)}>Retry</button>}</p>}
        {saved && <p role="status">Preferences saved. Your next recommendations will use these changes.</p>}
        <form onSubmit={save}>
            <fieldset disabled={loading || saving || !loaded}>
                <label htmlFor="interests-text">Academic interests</label>
                <textarea id="interests-text" maxLength={2000} rows={3} value={profile.interestsText}
                    placeholder="For example: web development, frontend, database applications"
                    onChange={e => { setSaved(false); setProfile({ ...profile, interestsText: e.target.value }); }} />
                <label htmlFor="about-text">About your project interests</label>
                <textarea id="about-text" maxLength={2000} rows={3} value={profile.aboutText}
                    placeholder="What would you like to build or learn? Avoid private or sensitive details."
                    onChange={e => { setSaved(false); setProfile({ ...profile, aboutText: e.target.value }); }} />
                <label htmlFor="preferred-role">Preferred role</label>
                <input id="preferred-role" maxLength={150} value={profile.preferredRole} placeholder="For example: Frontend Developer"
                    onChange={e => { setSaved(false); setProfile({ ...profile, preferredRole: e.target.value }); }} />
                <small>Use the role name shown on projects. Matching ignores case and extra spaces.</small>
                <button type="submit">{saving ? 'Saving…' : 'Save preferences'}</button>
            </fieldset>
        </form>
    </section>;
}
