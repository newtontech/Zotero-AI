// Features Component
window.Features = ({ lang }) => {
    const { Row, Col, Card, Typography } = antd;
    const { Title, Paragraph } = Typography;
    const { motion } = window.Motion;
    const { MessageSquare, FileText, FolderOpen, Cpu, Zap, Shield } = lucideReact;
    const t = window.AppData[lang].features;

    const iconMap = {
        MessageSquare: <MessageSquare size={24} />,
        FileText: <FileText size={24} />,
        FolderOpen: <FolderOpen size={24} />,
        Cpu: <Cpu size={24} />,
        Zap: <Zap size={24} />,
        Shield: <Shield size={24} />
    };

    return (
        <section id="features" style={{ padding: '80px 20px', background: '#fff' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <Title level={2}>Why Newton?</Title>
                    <Paragraph type="secondary" style={{ fontSize: '18px' }}>Supercharge your research workflow without compromising privacy.</Paragraph>
                </div>
                <Row gutter={[32, 32]}>
                    {t.map((f, i) => (
                        <Col xs={24} sm={12} lg={8} key={i}>
                            <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
                                <Card bordered={false} style={{ height: '100%', background: '#f9fafb', borderRadius: '16px' }} hoverable>
                                    <div style={{ color: '#1677ff', marginBottom: '16px', background: '#e6f4ff', width: 'fit-content', padding: '12px', borderRadius: '12px' }}>
                                        {iconMap[f.icon]}
                                    </div>
                                    <Title level={4}>{f.title}</Title>
                                    <Paragraph type="secondary">{f.desc}</Paragraph>
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            </div>
        </section>
    );
};
