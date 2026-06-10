import { createRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import { rootRoute } from './routes/__root'

const Dashboard = lazy(() => import('./routes/index'))
const Profiling = lazy(() => import('./routes/profiling/index'))
const Goals = lazy(() => import('./routes/goals/index'))
const NewGoal = lazy(() => import('./routes/goals/new'))
const GoalDetail = lazy(() => import('./routes/goals/$goalId'))
const UniverseBrowser = lazy(() => import('./routes/universe-browser/index'))
const Scorecard = lazy(() => import('./routes/scorecard/index'))
const FundDetail = lazy(() => import('./routes/scorecard/$schemeCode'))
const FundCompare = lazy(() => import('./routes/scorecard/compare'))
const Portfolio = lazy(() => import('./routes/portfolio/index'))
const Reviews = lazy(() => import('./routes/reviews/index'))
const ReviewsChecklist = lazy(() => import('./routes/reviews/checklist'))
const Journal = lazy(() => import('./routes/journal/index'))
const Settings = lazy(() => import('./routes/settings/index'))

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
})

const profilingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profiling',
  component: Profiling,
})

const goalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/goals',
  component: Goals,
})

const newGoalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/goals/new',
  component: NewGoal,
})

const goalDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/goals/$goalId',
  component: GoalDetail,
})

const universeBrowserRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/universe-browser',
  component: UniverseBrowser,
})

const scorecardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scorecard',
})

const scorecardIndexRoute = createRoute({
  getParentRoute: () => scorecardRoute,
  path: '/',
  component: Scorecard,
})

const fundDetailRoute = createRoute({
  getParentRoute: () => scorecardRoute,
  path: '$schemeCode',
  component: FundDetail,
})

const fundCompareRoute = createRoute({
  getParentRoute: () => scorecardRoute,
  path: 'compare',
  component: FundCompare,
})

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portfolio',
  component: Portfolio,
})

const reviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reviews',
})

const reviewsIndexRoute = createRoute({
  getParentRoute: () => reviewsRoute,
  path: '/',
  component: Reviews,
})

const reviewsChecklistRoute = createRoute({
  getParentRoute: () => reviewsRoute,
  path: 'checklist',
  component: ReviewsChecklist,
})

const journalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/journal',
  component: Journal,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: Settings,
})

export const routeTree = rootRoute.addChildren([
  dashboardRoute,
  profilingRoute,
  goalsRoute,
  newGoalRoute,
  goalDetailRoute,
  universeBrowserRoute,
  scorecardRoute.addChildren([scorecardIndexRoute, fundDetailRoute, fundCompareRoute]),
  portfolioRoute,
  reviewsRoute.addChildren([reviewsIndexRoute, reviewsChecklistRoute]),
  journalRoute,
  settingsRoute,
])
