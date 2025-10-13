# Contributing to Adventure Diary

Thank you for your interest in contributing to Adventure Diary! This document outlines the guidelines and standards for contributing to this project.

## 🏗️ Architecture Guidelines

### Mutation Flow Policy

**Server Actions for Forms; REST API for Client Fetches**

#### ✅ When to Use Server Actions

- Form submissions from server or client components
- Data mutations triggered by user interactions
- Operations that need automatic revalidation and redirects
- Simple CRUD operations with form validation

#### ✅ When to Use API Routes

- Data fetching from client components
- Complex queries with filtering/pagination
- Third-party API integrations
- Operations requiring custom response formats
- Real-time data updates (future feature)

#### Code Examples

**Server Action (Preferred for Forms)**:

```typescript
// lib/actions/campaigns.ts
"use server";
export async function createCampaign(formData: FormData) {
  const validatedFields = CreateCampaignSchema.safeParse({
    title: formData.get("title"),
    // ... other fields
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Database operation
  const [campaign] = await db
    .insert(campaigns)
    .values(validatedFields.data)
    .returning();

  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}`);
}
```

**API Route (For Client Fetches)**:

```typescript
// app/api/campaigns/route.ts
export async function GET() {
  const campaigns = await db.select().from(campaigns);
  return NextResponse.json(campaigns);
}
```

#### Migration Strategy

- **New Features**: Always use Server Actions for mutations
- **Existing API Routes**: Mark as `@deprecated` and migrate to Server Actions
- **Backward Compatibility**: Maintain deprecated routes with redirect notices
- **Timeline**: Complete migration within 2-3 major releases

## 🛠️ Development Standards

### Code Quality

- **TypeScript**: Strict mode enabled, no `any` types
- **Linting**: ESLint with Next.js configuration
- **Testing**: Write tests for new features
- **Documentation**: Update README and inline comments for complex logic

### Component Organization

- **Server Components**: Default choice for data fetching
- **Client Components**: Only when interactivity is required
- **File Structure**: Follow established patterns in `components/` directory

### Database Operations

- **Drizzle ORM**: Use for all database interactions
- **Migrations**: Create migrations for schema changes
- **Validation**: Use Zod schemas for input validation

## 🚀 Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Make** your changes following the guidelines above
4. **Test** thoroughly:
   - Run `npm run lint`
   - Run `npx tsc --noEmit`
   - Test in development environment
5. **Commit** with conventional commit messages
6. **Submit** a pull request with detailed description

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🐛 Reporting Issues

When reporting bugs, please include:

- Steps to reproduce
- Expected vs actual behavior
- Browser/console errors
- Environment details (OS, Node version, etc.)

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [DaisyUI Components](https://daisyui.com)

## 📞 Getting Help

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Discord**: Join our community Discord for real-time help

Thank you for contributing to Adventure Diary! 🎲✨
