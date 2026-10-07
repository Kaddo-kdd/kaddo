import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, createRootRoute, createRoute, RouterProvider, Navigate } from '@tanstack/react-router'
import { AppShell } from './components/AppShell'
import { RouteErrorFallback } from './components/ErrorBoundary'
import { Overview } from './routes/Overview'
import { Knowledge } from './routes/Knowledge'
import { KnowledgeLayer } from './routes/KnowledgeLayer'
import { KnowledgeArtifact } from './routes/KnowledgeArtifact'
import { WorkItems } from './routes/WorkItems'
import { WorkItemDetail } from './routes/WorkItemDetail'
import { WorkItemNew } from './routes/WorkItemNew'
import { WorkItemEditor } from './routes/WorkItemEditor'
import { System } from './routes/System'
import { Integrations } from './routes/Integrations'
import { ExternalWorkItems } from './routes/ExternalWorkItems'
import { Initiatives } from './routes/Initiatives'
import { InitiativeDetail } from './routes/InitiativeDetail'
import { Resources } from './routes/Resources'
import { ResourceDetail } from './routes/ResourceDetail'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

const rootRoute = createRootRoute({ component: AppShell })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => <Navigate to="/overview" /> })
const overviewRoute = createRoute({ getParentRoute: () => rootRoute, path: '/overview', component: Overview, errorComponent: RouteErrorFallback })

const knowledgeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/knowledge', component: Knowledge, errorComponent: RouteErrorFallback })
const knowledgeLayerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/knowledge/$layer', component: KnowledgeLayer, errorComponent: RouteErrorFallback })
const knowledgeArtifactRoute = createRoute({ getParentRoute: () => rootRoute, path: '/knowledge/$layer/$artifactId', component: KnowledgeArtifact, errorComponent: RouteErrorFallback })

const workItemsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/work-items', component: WorkItems, errorComponent: RouteErrorFallback })
const workItemNewRoute = createRoute({ getParentRoute: () => rootRoute, path: '/work-items/new', component: WorkItemNew, errorComponent: RouteErrorFallback })
const workItemDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/work-items/$workItemId', component: WorkItemDetail, errorComponent: RouteErrorFallback })
const workItemEditRoute = createRoute({ getParentRoute: () => rootRoute, path: '/work-items/$workItemId/edit', component: WorkItemEditor, errorComponent: RouteErrorFallback })
const systemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/system',
  component: System,
  errorComponent: RouteErrorFallback,
  validateSearch: (search: Record<string, unknown>): { node?: string; workItem?: string } => ({
    node: typeof search.node === 'string' ? search.node : undefined,
    workItem: typeof search.workItem === 'string' ? search.workItem : undefined,
  }),
})

const integrationsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/integrations', component: Integrations, errorComponent: RouteErrorFallback })
const externalWorkItemsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/external-items', component: ExternalWorkItems, errorComponent: RouteErrorFallback })

const initiativesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/initiatives', component: Initiatives, errorComponent: RouteErrorFallback })
const initiativeDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/initiatives/$initiativeId', component: InitiativeDetail, errorComponent: RouteErrorFallback })
const resourcesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/resources', component: Resources, errorComponent: RouteErrorFallback })
const resourceDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/resources/$resourceId', component: ResourceDetail, errorComponent: RouteErrorFallback })

const routeTree = rootRoute.addChildren([indexRoute, overviewRoute, knowledgeRoute, knowledgeLayerRoute, knowledgeArtifactRoute, workItemsRoute, workItemNewRoute, workItemDetailRoute, workItemEditRoute, systemRoute, integrationsRoute, externalWorkItemsRoute, initiativesRoute, initiativeDetailRoute, resourcesRoute, resourceDetailRoute])
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
