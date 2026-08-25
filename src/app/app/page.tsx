'use client';

import Link from 'next/link';

import { siteConfig } from '@/app/siteConfig';
import { Button } from '@/components/atom/Button';
import { PageHeaderWithAction } from '@/components/molecules/common/PageHeaderWithAction';

const dashboardLinks = [
  { title: 'Files', description: 'Manage uploaded files.', href: siteConfig.baseLinks.files },
  { title: 'Packages', description: 'Manage available packages.', href: siteConfig.baseLinks.packages },
  { title: 'Blogs', description: 'Manage blog posts.', href: siteConfig.baseLinks.blogs },
  { title: 'Categories', description: 'Manage blog categories.', href: siteConfig.baseLinks.categories },
  { title: 'Email Templates', description: 'Manage reusable email templates.', href: '/app/email-templates' },
  { title: 'Email Campaigns', description: 'Manage email campaigns.', href: '/app/email-campaigns' },
  { title: 'Contact Management', description: 'Review contact submissions.', href: '/app/contact-management' },
  { title: 'Credit History', description: 'View credit activity.', href: siteConfig.baseLinks.creditHistory },
  { title: 'Billing', description: 'Manage billing settings.', href: siteConfig.baseLinks.settings.billing },
  { title: 'Admin', description: 'Open the administration dashboard.', href: siteConfig.baseLinks.admin.dashboard },
];

export default function AppPage() {
  return (
    <>
      <PageHeaderWithAction
        title="Kostra Dashboard"
        description="Application workspace and management dashboard"
      />

      <div className="space-y-6 p-4">
        <div className="rounded-lg border border-border bg-background p-5">
          <h2 className="text-lg font-semibold text-text">Application routes</h2>
          <p className="mt-1 text-sm text-text-muted">
            Use the links below to test the application areas. Authentication and third-party integrations can remain disabled during development.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardLinks.map(link => (
            <div key={link.href} className="rounded-lg border border-border p-4">
              <h3 className="font-medium text-text">{link.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{link.description}</p>
              <div className="mt-4">
                <Button asChild variant="secondary">
                  <Link href={link.href}>Open</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
