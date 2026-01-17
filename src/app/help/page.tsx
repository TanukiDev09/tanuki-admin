
const glossaryTerms = [
  {
    term: 'Pista Financiera',
    definition:
      'El tiempo que tu negocio puede operar con el dinero disponible antes de quedarse sin fondos. Se mide en meses. Por ejemplo, si tienes $10,000,000 y gastas $1,000,000 al mes, tu pista financiera es de 10 meses.',
  },
  {
    term: 'Tasa de Consumo',
    definition:
      'La velocidad a la que tu negocio gasta dinero cada mes. Incluye todos los gastos operativos. Una tasa de consumo baja significa que tu dinero dura más tiempo.',
  },
  {
    term: 'Puntuación de Salud',
    definition:
      'Una calificación de 0 a 100 que indica qué tan saludable está tu negocio financieramente. Considera la pista financiera, márgenes de ganancia y tendencias de flujo de efectivo.',
  },
  {
    term: 'Saldo Neto',
    definition:
      'La diferencia entre tus ingresos totales y tus gastos totales. Un saldo neto positivo significa que estás ganando más de lo que gastas.',
  },
  {
    term: 'Margen de Ganancia',
    definition:
      'El porcentaje de ingresos que queda después de pagar todos los gastos. Si vendes por $100 y gastas $70, tu margen de ganancia es del 30%.',
  },
  {
    term: 'Flujo de Efectivo',
    definition:
      'El movimiento de dinero que entra y sale de tu negocio. Un flujo de efectivo positivo significa que entra más dinero del que sale.',
  },
];

export default function AyudaPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-3 font-serif">Glosario Financiero</h1>
        <p className="text-muted-foreground">
          Términos financieros explicados sin jerga técnica, diseñados para emprendedores.
        </p>
      </div>

      <div className="space-y-4">
        {glossaryTerms.map((item) => (
          <div key={item.term} className="card p-6">
            <h2 className="text-xl font-semibold mb-3 text-primary font-serif">
              {item.term}
            </h2>
            <p className="text-muted-foreground leading-relaxed">{item.definition}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-8 bg-info/5 border-info/20">
        <h2 className="text-lg font-semibold mb-2 text-info">¿Necesitas más ayuda?</h2>
        <p className="text-sm text-muted-foreground">
          Esta sección se expandirá con tutoriales, videos y guías paso a paso para ayudarte
          a comprender mejor tus finanzas.
        </p>
      </div>
    </div>
  );
}
