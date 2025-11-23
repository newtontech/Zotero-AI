// HowItWorks Component
window.HowItWorks = ({ lang }) => {
    const { Steps, Card, Typography } = antd;
    const { Title, Text } = Typography;
    const { BookOpen, Sparkles, Cpu, ArrowRight, CheckCircle } = lucideReact;
    const t = window.AppData[lang].howItWorks;

    return (
        <section id="how-it-works" style={{ padding: '80px 20px', background: '#f0f5ff' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: '60px' }}>{t.title}</Title>

                {/* Visual Diagram */}
                <div style={{ marginBottom: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <Card style={{ textAlign: 'center', width: '200px', borderRadius: '16px' }}>
                        <BookOpen size={40} color="#f5222d" style={{ marginBottom: '10px' }} />
                        <Title level={5}>Zotero</Title>
                        <Text type="secondary">Your Library</Text>
                    </Card>
                    <ArrowRight size={30} color="#9ca3af" className="arrow-anim" />
                    <Card style={{ textAlign: 'center', width: '220px', borderRadius: '16px', border: '2px solid #1677ff' }}>
                        <Sparkles size={40} color="#1677ff" style={{ marginBottom: '10px' }} />
                        <Title level={5}>Newton Extension</Title>
                        <Text type="secondary">Local Processing</Text>
                    </Card>
                    <ArrowRight size={30} color="#9ca3af" className="arrow-anim" />
                    <Card style={{ textAlign: 'center', width: '200px', borderRadius: '16px' }}>
                        <Cpu size={40} color="#52c41a" style={{ marginBottom: '10px' }} />
                        <Title level={5}>LLM</Title>
                        <Text type="secondary">OpenAI / Local</Text>
                    </Card>
                </div>

                <Steps
                    current={-1}
                    direction="vertical"
                    items={t.steps.map(s => ({
                        title: <span style={{ fontSize: '18px', fontWeight: 600 }}>{s.title}</span>,
                        description: <span style={{ fontSize: '16px', color: '#4b5563' }}>{s.desc}</span>,
                        icon: <CheckCircle />
                    }))}
                />
            </div>
        </section>
    );
};
