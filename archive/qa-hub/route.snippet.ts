    // -----------------------------------------------------
    // ADMIN QA HUB
    // -----------------------------------------------------
    {
        path: 'admin/qa',
        canActivate: [adminGuard],
        data: {
            title: 'Admin | QA Hub',
        },
        loadComponent: () => import('./features/admin/pages/qa/qa-admin.component').then((m) => m.QaAdminComponent),
    },
