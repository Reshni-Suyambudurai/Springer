INSERT INTO programs (program_name) VALUES
    ('B_TECH'),
    ('M_TECH'),
    ('MBA'),
    ('MCA'),
    ('BCA'),
    ('B_E'),
    ('M_E'),
    ('B_SC'),
    ('M_SC'),
    ('BBA'),
    ('B_COM'),
    ('M_COM'),
    ('B_A'),
    ('M_A'),
    ('DIPLOMA'),
    ('PHD')
ON CONFLICT (program_name) DO NOTHING;