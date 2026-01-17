import GlobalAgreementList from '@/components/agreements/GlobalAgreementList';

export default function AgreementsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contratos</h1>
          <p className="text-muted-foreground mt-2">
            Gestión global de contratos y acuerdos con creadores.
          </p>
        </div>
      </div>

      <GlobalAgreementList />
    </div>
  );
}
