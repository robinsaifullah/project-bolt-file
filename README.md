# Penacle Path

## Development

This project uses:
- GitHub for version control
- Supabase for database
- StackBlitz for development
- Netlify for deployment

### Setup

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/penaclepath.git
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start development server:
\`\`\`bash
npm run dev
\`\`\`

### Environment Variables

Create a \`.env\` file with:
\`\`\`
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
\`\`\`

### Deployment

The project automatically deploys to Netlify when pushing to the main branch.

### Database Migrations

Database migrations are in \`/supabase/migrations\` and automatically deploy when pushed to main.