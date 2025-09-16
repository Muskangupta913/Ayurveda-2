export default function MarketingCards() {
  const cards = [
    {
      title: "SMS Marketing",
      description: "Send bulk SMS campaigns to reach your audience instantly.",
      icon: "📱",
      bg: "bg-blue-50",
    },
    {
      title: "WhatsApp Marketing",
      description: "Engage customers with personalized WhatsApp campaigns.",
      icon: "💬",
      bg: "bg-green-50",
    },
    {
      title: "Gmail Marketing",
      description: "Deliver professional email marketing campaigns directly to inbox.",
      icon: "✉️",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`${card.bg} rounded-2xl shadow-md hover:shadow-lg transition-all p-6 flex flex-col items-center text-center`}
        >
          <div className="text-5xl">{card.icon}</div>
          <h2 className="text-lg font-semibold text-gray-800 mt-4">{card.title}</h2>
          <p className="text-sm text-gray-600 mt-2">{card.description}</p>
          <button className="mt-4 px-4 py-2 rounded-lg bg-[#2D9AA5] text-white font-medium hover:bg-[#23808A] transition">
            Create Campaign
          </button>
        </div>
      ))}
    </div>
  );
}
