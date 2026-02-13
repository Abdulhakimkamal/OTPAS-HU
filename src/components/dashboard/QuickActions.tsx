import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'accent';
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <div style={{
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px'
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        marginBottom: '16px',
        color: '#1f2937'
      }}>
        Quick Actions
      </h3>
      
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => {
            console.log('=== BUTTON CLICKED ===');
            console.log('Action:', action.label);
            console.log('Target:', action.href);
            console.log('Navigating...');
            navigate(action.href);
          }}
          style={{
            display: 'block',
            width: '100%',
            padding: '16px',
            margin: '8px 0',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            background: action.variant === 'primary' ? '#eff6ff' : 'white',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '14px',
            fontWeight: '500',
            color: '#1f2937',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = action.variant === 'primary' ? '#eff6ff' : 'white';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#f3f4f6',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {action.icon}
            </div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                {action.label}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {action.description}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
