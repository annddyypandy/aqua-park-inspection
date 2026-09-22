import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { InspectionFormPage } from './pages/InspectionFormPage';
import { InspectionListPage } from './pages/InspectionListPage';
import { InspectionOverviewPage } from './pages/InspectionOverviewPage';
import { InspectionReportPage } from './pages/InspectionReportPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PieceFormPage } from './pages/PieceFormPage';

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<InspectionListPage />} />
          <Route path="/inspections/new" element={<InspectionFormPage mode="create" />} />
          <Route
            path="/inspections/:inspectionId/edit"
            element={<InspectionFormPage mode="edit" />}
          />
          <Route path="/inspections/:inspectionId/report" element={<InspectionReportPage />} />
          <Route path="/inspections/:inspectionId" element={<InspectionOverviewPage />} />
          <Route
            path="/inspections/:inspectionId/pieces/new"
            element={<PieceFormPage mode="create" />}
          />
          <Route
            path="/inspections/:inspectionId/pieces/:pieceId"
            element={<PieceFormPage mode="edit" />}
          />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
