import ResultsChart from "./ResultsChart";

function ChartCard({ data, language }) {
  if (!data?.length) return null;

  return (
    <div className="mb-4 rounded-xl border border-[#333] bg-[#2A2A2A] p-3.5">
      <ResultsChart data={data} language={language} />
    </div>
  );
}

export default ChartCard;
