import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar';
import { recommendationRequest } from '../../api/recommendations';
import '../../styles/Recommendations.css';

export default function RecommendedProjects() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true); setError('');
        recommendationRequest().then(result => { if (active) setData(result); })
            .catch(err => { if (active) setError(err.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [attempt]);
    return <div className="recommendation-page">
        <Navbar />
        <main className="recommendation-container">
            <h1>Recommended for You</h1>
            <p>Up to 10 projects matched to your skills, interests and preferred role. Match scores describe relevance, not a prediction of success.</p>
            <div className="recommendation-actions"><Link to="/student-profile">Update technical profile</Link><Link to="/browse-projects">Browse all projects</Link></div>
            {loading && <p role="status">Finding matching projects…</p>}
            {error && <div role="alert"><p>{error}</p><button onClick={() => setAttempt(n => n + 1)}>Retry</button> <Link to="/">Log in again</Link></div>}
            {!loading && !error && data && <>
                {data.profileStatus?.incomplete && <p role="status">Complete your profile for better matches: {data.profileStatus.missingFields.join(', ')}.</p>}
                {data.recommendations.length === 0 && <p>{data.profileStatus?.insufficient
                    ? 'Add skills, interests or a preferred role to get started.'
                    : 'No available projects to recommend right now. You can still browse all projects.'}</p>}
                <div className="recommendation-grid">
                    {data.recommendations.slice(0, 10).map(project => <article className="recommendation-card" key={project.projectId}>
                        <span className="recommendation-match">{project.matchPercentage}% Match</span>
                        <h2>{project.projectName}</h2>
                        <p className="recommendation-summary">{project.description}</p>
                        <p><strong>Matched skills:</strong> {project.matchedSkills.join(', ') || 'None yet'}</p>
                        <p><strong>Missing required skills:</strong> {project.missingSkills.join(', ') || 'None'}</p>
                        <p>{project.roleMatched ? `Preferred role available: ${project.matchedRole}` : 'No preferred-role match'}</p>
                        <details><summary>How this match was calculated</summary>
                            <ul><li>Skill match: {(project.scores.skill * 100).toFixed(1)}% (60% weight)</li>
                                <li>Interest/text similarity: {(project.scores.text * 100).toFixed(1)}% (20% weight)</li>
                                <li>Role match: {(project.scores.role * 100).toFixed(1)}% (20% weight)</li></ul>
                        </details>
                        <Link className="recommendation-open" to={`/browse-projects?projectId=${project.projectId}`}>View project and apply</Link>
                    </article>)}
                </div>
            </>}
        </main>
    </div>;
}
