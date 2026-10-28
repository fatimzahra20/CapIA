import ResultsChart from "./ResultsChart";

function ChartCard({ data, language }) {
  if (!data?.length) return null;

  return (
    <div className="mb-4 rounded-2xl border border-[#E3E8EF] bg-[#F8FAFC] p-3.5">
      <ResultsChart data={data} language={language} />
    </div>
  );
}

export default ChartCard;
