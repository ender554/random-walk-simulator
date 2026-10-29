import SiteLayout from '../../shared/SiteLayout';
import { liveTools, toolPath } from '../../tools';

// Served by Cloudflare Pages with a 404 status for any address that doesn't exist.
function NotFound() {
  return (
    <SiteLayout>
      <article className="prose">
        <h1>Page not found</h1>
        <p>
          That address doesn't match any page. Try <a href="/">the home page</a> or one of the simulators:
        </p>
        <ul>
          {liveTools.map((t) => (
            <li key={t.slug}>
              <a href={toolPath(t.slug)}>{t.name}</a>
            </li>
          ))}
        </ul>
      </article>
    </SiteLayout>
  );
}

export default NotFound;
