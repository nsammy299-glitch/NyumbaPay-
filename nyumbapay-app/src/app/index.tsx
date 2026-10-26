import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Switch
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); 
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State (Onboarding)
  const [formData, setFormData] = useState({
    fullName: '', idNumber: '', phoneNumber: '', email: '', guarantorPhone: '',
    personaType: 'daily_hustler', monthlyRent: '15000', payoutMethod: 'mpesa',
    landlordName: '', landlordAccount: '', password: '', confirmPassword: '',
    appPin: '', biometricEnabled: true, smsAlertsEnabled: true,
  });

  // Login State
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  // Vault, Transactions & Marketplace Live State
  const [vaultData, setVaultData] = useState({ current_balance: 0, target_amount: 15000 });
  const [transactions, setTransactions] = useState([]);
  const [houses, setHouses] = useState([]);
  const [movers, setMovers] = useState([]);
  
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [penaltyLoading, setPenaltyLoading] = useState(false);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentScreen('dashboard');
      }
    } catch (err) {
      console.log('Session check error:', err);
    }
  };

  // Fetch live vault data and transaction history on dashboard load
  useEffect(() => {
    if (currentScreen === 'dashboard') {
      fetchVaultData();
    }
    if (currentScreen === 'marketplace') {
      fetchMarketplaceData();
    }
  }, [currentScreen]);

  const fetchVaultData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vault } = await supabase
        .from('rent_vaults')
        .select('current_balance, target_amount')
        .eq('tenant_id', user.id)
        .single();

      if (vault) {
        setVaultData(vault);
      }

      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (txs) {
        setTransactions(txs);
      }
    } catch (err) {
      console.log('Error fetching vault data:', err);
    }
  };

  const fetchMarketplaceData = async () => {
    try {
      const { data: houseData } = await supabase.from('houses').select('*');
      if (houseData) setHouses(houseData);

      const { data: moverData } = await supabase.from('moving_services').select('*');
      if (moverData) setMovers(moverData);
    } catch (err) {
      console.log('Error fetching marketplace data:', err);
    }
  };

  const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));
  
  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('users').insert([
          {
            id: authData.user.id,
            full_name: formData.fullName,
            id_number: formData.idNumber,
            phone_number: formData.phoneNumber,
            email: formData.email,
            guarantor_phone: formData.guarantorPhone,
            role: 'tenant',
            persona_type: formData.personaType,
          },
        ]);

        if (profileError) throw profileError;

        const { error: vaultError } = await supabase.from('rent_vaults').insert([
          {
            tenant_id: authData.user.id,
            target_amount: parseFloat(formData.monthlyRent),
            current_balance: 0,
            next_due_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
              .toISOString()
              .split('T')[0],
          },
        ]);

        if (vaultError) throw vaultError;

        await supabase.from('transactions').insert([
          {
            tenant_id: authData.user.id,
            title: 'Vault Initialized',
            amount: 0,
            type: 'positive',
          }
        ]);

        setLoading(false);
        setCurrentScreen('dashboard');
      }
    } catch (err) {
      setLoading(false);
      alert(err.message || 'An error occurred during account creation.');
    }
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      setLoginLoading(false);
      setCurrentScreen('dashboard');
    } catch (err) {
      setLoginLoading(false);
      alert(err.message || 'Login failed. Check your credentials.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentScreen('home');
  };

  const processTopup = async () => {
    if (!topupAmount) return;
    setTopupLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No active user session');

      const { data: vault, error: fetchError } = await supabase
        .from('rent_vaults')
        .select('id, current_balance')
        .eq('tenant_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const parsedAmount = parseFloat(topupAmount);
      const newBalance = parseFloat(vault.current_balance) + parsedAmount;

      const { error: updateError } = await supabase
        .from('rent_vaults')
        .update({ current_balance: newBalance })
        .eq('id', vault.id);

      if (updateError) throw updateError;

      await supabase.from('transactions').insert([
        {
          tenant_id: user.id,
          title: 'M-Pesa Top Up',
          amount: parsedAmount,
          type: 'positive',
        }
      ]);

      setTopupLoading(false);
      setTopupAmount('');
      setCurrentScreen('dashboard');
    } catch (err) {
      setTopupLoading(false);
      alert(err.message || 'Top up failed');
    }
  };

  const processPenaltyBreak = async () => {
    setPenaltyLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No active user session');

      const { data: vault, error: fetchError } = await supabase
        .from('rent_vaults')
        .select('id, current_balance')
        .eq('tenant_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const payoutAmount = vault.current_balance * 0.95;

      const { error: updateError } = await supabase
        .from('rent_vaults')
        .update({ current_balance: 0 })
        .eq('id', vault.id);

      if (updateError) throw updateError;

      await supabase.from('transactions').insert([
        {
          tenant_id: user.id,
          title: 'Penalty Break (Emergency Withdrawal)',
          amount: payoutAmount,
          type: 'negative',
        }
      ]);

      setPenaltyLoading(false);
      setCurrentScreen('dashboard');
      alert('Emergency withdrawal successful. 5% safety fee deducted.');
    } catch (err) {
      setPenaltyLoading(false);
      alert(err.message || 'Penalty break failed');
    }
  };

  // ==========================================
  // SCREEN 0: HOMEPAGE
  // ==========================================
  if (currentScreen === 'home') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.homeScrollContainer}>
          <View style={styles.navBar}>
            <Text style={styles.navLogo}>NyumbaPay<Text style={{color: '#059669'}}>.</Text></Text>
            <TouchableOpacity style={styles.navLoginBtn} onPress={() => setCurrentScreen('login')}>
              <Text style={styles.navLoginText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroSection}>
            <Text style={styles.heroTag}>KENYA'S REVOLUTIONARY RENT VAULT</Text>
            <Text style={styles.heroHeading}>Secure Your Home. <Text style={{color: '#059669'}}>Save Effortlessly.</Text></Text>
            <Text style={styles.heroSubtext}>
              Take complete control of your housing security. Lock away rent bit by bit via M-Pesa, automate landlord payouts, and relocate with 1-click ease.
            </Text>

            <TouchableOpacity style={styles.heroCtaBtn} onPress={() => setCurrentScreen('onboarding')}>
              <Text style={styles.heroCtaText}>Get Started — It's Free</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.etheraCard}>
              <View style={[styles.iconBox, {backgroundColor: '#d1fae5'}]}><Text style={{fontSize: 20}}>🛡️</Text></View>
              <View style={{flex: 1}}>
                <Text style={styles.cardTitle}>The Secure Rent Vault</Text>
                <Text style={styles.cardDesc}>Micro-save your rent daily or weekly through M-Pesa. Never face month-end panic again.</Text>
              </View>
            </View>

            <View style={styles.etheraCard}>
              <View style={[styles.iconBox, {backgroundColor: '#e0f2fe'}]}><Text style={{fontSize: 20}}>🚚</Text></View>
              <View style={{flex: 1}}>
                <Text style={styles.cardTitle}>1-Click Relocation</Text>
                <Text style={styles.cardDesc}>Browse verified listings and instantly book reliable moving trucks when changing houses.</Text>
              </View>
            </View>

            <View style={styles.etheraCard}>
              <View style={[styles.iconBox, {backgroundColor: '#d1fae5'}]}><Text style={{fontSize: 20}}>⚡</Text></View>
              <View style={{flex: 1}}>
                <Text style={styles.cardTitle}>Direct Landlord Payouts</Text>
                <Text style={styles.cardDesc}>Automated, secure M-Pesa or bank disbursements straight to your landlord on schedule.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // LOGIN SCREEN
  // ==========================================
  if (currentScreen === 'login') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to access your Rent Vault</Text>
            </View>

            <View style={styles.formSpace}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="you@email.com" 
                  keyboardType="email-address"
                  value={loginData.email}
                  onChangeText={(text) => setLoginData(prev => ({ ...prev, email: text }))} 
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="••••••••" 
                  secureTextEntry
                  value={loginData.password}
                  onChangeText={(text) => setLoginData(prev => ({ ...prev, password: text }))} 
                />
              </View>

              <TouchableOpacity style={styles.primaryButton} disabled={loginLoading} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>{loginLoading ? 'Signing In...' : 'Sign In'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{alignItems: 'center', marginTop: 16}} onPress={() => setCurrentScreen('home')}>
                <Text style={{color: '#64748b', fontWeight: '600'}}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // SCREEN 5: PENALTY BREAK
  // ==========================================
  if (currentScreen === 'penalty') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.dashboardContainer}>
          <View style={styles.dashHeader}>
            <View>
              <Text style={styles.greeting}>Penalty Break ⚠️</Text>
              <Text style={styles.dashSubtitle}>Emergency Vault Withdrawal</Text>
            </View>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('dashboard')}>
              <Text style={styles.backButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.penaltyWarningCard}>
            <Text style={styles.penaltyWarningTitle}>Are you sure you want to break your vault?</Text>
            <Text style={styles.penaltyWarningDesc}>
              Your Rent Vault protects your housing security. Breaking it early incurs a strict 5% safety fee.
            </Text>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityRow}>
              <Text style={styles.label}>Current Vault Balance</Text>
              <Text style={{fontWeight: 'bold', fontSize: 16, color: '#0f172a'}}>KES {vaultData.current_balance.toLocaleString()}</Text>
            </View>
            <View style={styles.activityRow}>
              <Text style={styles.label}>Early Break Fee (5%)</Text>
              <Text style={{fontWeight: 'bold', fontSize: 16, color: '#ef4444'}}>- KES {(vaultData.current_balance * 0.05).toLocaleString()}</Text>
            </View>
            <View style={[styles.activityRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={{fontWeight: 'bold', color: '#0f172a'}}>You Will Receive</Text>
              <Text style={{fontWeight: '900', fontSize: 18, color: '#059669'}}>KES {(vaultData.current_balance * 0.95).toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.penaltyBtn} 
            disabled={penaltyLoading}
            onPress={processPenaltyBreak}
          >
            <Text style={styles.penaltyBtnText}>
              {penaltyLoading ? 'Processing...' : 'Accept Fee & Withdraw'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // SCREEN 4: QUICK SAVE (TOP UP)
  // ==========================================
  if (currentScreen === 'topup') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.dashboardContainer}>
          <View style={styles.dashHeader}>
            <View>
              <Text style={styles.greeting}>Quick Save</Text>
              <Text style={styles.dashSubtitle}>Add money to your Rent Vault</Text>
            </View>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('dashboard')}>
              <Text style={styles.backButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Enter Amount (KES)</Text>
            <TextInput 
              style={styles.amountInput} 
              placeholder="0" 
              keyboardType="numeric"
              value={topupAmount}
              onChangeText={setTopupAmount}
            />

            <View style={styles.quickAmountRow}>
              {['100', '500', '1000'].map(amt => (
                <TouchableOpacity key={amt} style={styles.quickAmountChip} onPress={() => setTopupAmount(amt)}>
                  <Text style={styles.quickAmountText}>+{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.paymentInfoBox}>
              <Text style={styles.paymentInfoTitle}>M-Pesa Express</Text>
              <Text style={styles.paymentInfoDesc}>A prompt will be sent to {formData.phoneNumber || 'your phone'}. Enter your M-Pesa PIN.</Text>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, { opacity: topupAmount ? 1 : 0.5 }]} 
              disabled={!topupAmount || topupLoading}
              onPress={processTopup}
            >
              <Text style={styles.primaryButtonText}>{topupLoading ? 'Processing...' : `Save KES ${topupAmount || '0'}`}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // SCREEN 3: MARKETPLACE & RELOCATION (Live from Supabase)
  // ==========================================
  if (currentScreen === 'marketplace') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.dashboardContainer}>
          <View style={styles.dashHeader}>
            <View>
              <Text style={styles.greeting}>Move & Relocate 🚚</Text>
              <Text style={styles.dashSubtitle}>Stress-free 1-click move out</Text>
            </View>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('dashboard')}>
              <Text style={styles.backButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.moveOutCard}>
            <Text style={styles.moveOutTitle}>Ready to leave your current house?</Text>
            <Text style={styles.moveOutDesc}>Tap below to notify your landlord, release your deposit, and pause your vault.</Text>
            <TouchableOpacity style={styles.moveOutBtn}><Text style={styles.moveOutBtnText}>Initiate 1-Click Move Out</Text></TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Verified Houses Available</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            {houses.length === 0 ? (
              <Text style={{color: '#64748b', fontSize: 13, padding: 8}}>No listings available</Text>
            ) : (
              houses.map(house => (
                <View key={house.id} style={styles.houseCard}>
                  <View style={styles.houseImagePlaceholder}><Text style={{color: '#94a3b8'}}>Image</Text></View>
                  <Text style={styles.houseTitle}>{house.title}</Text>
                  <Text style={{fontSize: 12, color: '#64748b', marginBottom: 4}}>{house.location}</Text>
                  <Text style={styles.housePrice}>KES {house.price.toLocaleString()} / mo</Text>
                  <TouchableOpacity style={styles.bookBtn}><Text style={styles.bookBtnText}>View Details</Text></TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          <Text style={styles.sectionLabel}>Need a Moving Truck?</Text>
          <View style={styles.activityCard}>
            {movers.length === 0 ? (
              <Text style={{color: '#64748b', fontSize: 13, padding: 8}}>No movers available</Text>
            ) : (
              movers.map((mover, index) => (
                <View key={mover.id} style={[styles.activityRow, index === movers.length - 1 && { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                  <View>
                    <Text style={styles.activityTitle}>{mover.provider_name}</Text>
                    <Text style={styles.activityDate}>Starts at KES {mover.base_price.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity style={styles.actionBoxSmall}><Text style={styles.actionTextSmall}>Book</Text></TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // SCREEN 2: THE DASHBOARD UI
  // ==========================================
  if (currentScreen === 'dashboard') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.dashboardContainer}>
          <View style={styles.dashHeader}>
            <View>
              <Text style={styles.greeting}>Hello, {formData.fullName || 'Hustler'} 👋</Text>
              <Text style={styles.dashSubtitle}>Your Rent Vault is active</Text>
            </View>
            <TouchableOpacity style={styles.avatar}>
              <Text style={styles.avatarText}>{formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'H'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.vaultCard}>
            <Text style={styles.vaultLabel}>CURRENT VAULT BALANCE</Text>
            <Text style={styles.vaultAmount}>KES {vaultData.current_balance.toLocaleString()}</Text>
            <Text style={styles.vaultTarget}>Target: KES {vaultData.target_amount.toLocaleString()} / month</Text>
            
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (vaultData.current_balance / vaultData.target_amount) * 100)}%` }]} />
            </View>
            
            <TouchableOpacity style={styles.topUpBtn} onPress={() => setCurrentScreen('topup')}>
              <Text style={styles.topUpBtnText}>+ Quick Save (Top Up)</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Vault Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionBox} onPress={() => setCurrentScreen('penalty')}>
              <Text style={styles.actionIcon}>⚠️</Text>
              <Text style={styles.actionText}>Penalty Break</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBox} onPress={() => setCurrentScreen('marketplace')}>
              <Text style={styles.actionIcon}>🏠</Text>
              <Text style={styles.actionText}>1-Click Move Out</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {transactions.length === 0 ? (
              <Text style={{fontSize: 13, color: '#64748b', textAlign: 'center', padding: 8}}>No recent activity</Text>
            ) : (
              transactions.map((tx, index) => (
                <View key={tx.id || index} style={[styles.activityRow, index === transactions.length - 1 && { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                  <View>
                    <Text style={styles.activityTitle}>{tx.title}</Text>
                    <Text style={styles.activityDate}>{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <Text style={[styles.activityAmountPositive, tx.type === 'negative' && { color: '#ef4444' }]}>
                    {tx.type === 'negative' ? '-' : '+'} KES {tx.amount.toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity style={{marginTop: 30, alignItems: 'center'}} onPress={handleLogout}>
            <Text style={{color: '#ef4444', fontWeight: 'bold'}}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // SCREEN 1: THE ONBOARDING UI
  // ==========================================
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.stepText}>STEP {step} OF 3</Text>
            <Text style={styles.title}>
              {step === 1 && 'Create your account'}
              {step === 2 && 'Your plan and rent'}
              {step === 3 && 'Lock your app'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 && 'Takes about a minute'}
              {step === 2 && 'Customize your settings'}
              {step === 3 && 'Only you can open your vault'}
            </Text>
          </View>

          {step === 1 && (
            <View style={styles.formSpace}>
              <View style={styles.inputGroup}><Text style={styles.label}>Full name</Text><TextInput style={styles.input} placeholder="As on your ID" value={formData.fullName} onChangeText={(text) => updateForm('fullName', text)} /></View>
              <View style={styles.inputGroup}><Text style={styles.label}>ID number</Text><TextInput style={styles.input} placeholder="e.g. 12345678" keyboardType="numeric" value={formData.idNumber} onChangeText={(text) => updateForm('idNumber', text)} /></View>
              <View style={styles.inputGroup}><Text style={styles.label}>Phone number</Text><TextInput style={styles.input} placeholder="07XX XXX XXX" keyboardType="phone-pad" value={formData.phoneNumber} onChangeText={(text) => updateForm('phoneNumber', text)} /></View>
              <View style={styles.inputGroup}><Text style={styles.label}>Email address</Text><TextInput style={styles.input} placeholder="you@email.com" keyboardType="email-address" value={formData.email} onChangeText={(text) => updateForm('email', text)} /></View>
              <View style={styles.inputGroup}><Text style={styles.label}>Guarantor Phone</Text><TextInput style={styles.input} placeholder="07XX XXX XXX" keyboardType="phone-pad" value={formData.guarantorPhone} onChangeText={(text) => updateForm('guarantorPhone', text)} /></View>
              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}><Text style={styles.primaryButtonText}>Continue</Text></TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.formSpace}>
              <Text style={styles.sectionLabel}>Monthly rent (KES)</Text>
              <View style={styles.row}>
                {['10000', '15000', '20000', '50000'].map(amount => (
                  <TouchableOpacity key={amount} style={[styles.chip, formData.monthlyRent === amount && styles.chipActive]} onPress={() => updateForm('monthlyRent', amount)}>
                    <Text style={[styles.chipText, formData.monthlyRent === amount && styles.chipTextActive]}>{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.sectionLabel}>Landlord Payout Method</Text>
              <View style={styles.row}>
                {['mpesa', 'paybill', 'bank'].map(method => (
                  <TouchableOpacity key={method} style={[styles.chip, formData.payoutMethod === method && styles.chipActiveBlue]} onPress={() => updateForm('payoutMethod', method)}>
                    <Text style={[styles.chipText, formData.payoutMethod === method && styles.chipTextActiveBlue]}>{method.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentScreen('home')}><Text style={styles.secondaryButtonText}>Back to Home</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, {flex: 2, marginTop: 0}]} onPress={handleNext}><Text style={styles.primaryButtonText}>Continue</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.formSpace}>
              <View style={styles.inputGroup}><Text style={styles.label}>Password (Min 6 chars)</Text><TextInput style={styles.input} placeholder="••••••••" secureTextEntry value={formData.password} onChangeText={(text) => updateForm('password', text)} /></View>
              <View style={styles.inputGroup}><Text style={styles.label}>Create App PIN (4 digits)</Text><TextInput style={[styles.input, {textAlign: 'center', letterSpacing: 10, fontSize: 20}]} placeholder="••••" maxLength={4} keyboardType="numeric" secureTextEntry value={formData.appPin} onChangeText={(text) => updateForm('appPin', text)} /></View>
              <View style={styles.toggleRow}>
                <View><Text style={styles.toggleTitle}>Fingerprint Unlock</Text><Text style={styles.toggleDesc}>Quick and safe access</Text></View>
                <Switch value={formData.biometricEnabled} onValueChange={(val) => updateForm('biometricEnabled', val)} trackColor={{ false: "#e2e8f0", true: "#059669" }} />
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}><Text style={styles.secondaryButtonText}>Back</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, {flex: 2, marginTop: 0}]} onPress={handleSubmit}><Text style={styles.primaryButtonText}>{loading ? 'Creating Vault...' : 'Finish Setup'}</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  
  homeScrollContainer: { padding: 24, paddingBottom: 60, maxWidth: 600, alignSelf: 'center', width: '100%' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, marginTop: 12 },
  navLogo: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  navLoginBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  navLoginText: { fontSize: 13, fontWeight: '700', color: '#059669' },
  
  heroSection: { marginBottom: 32 },
  heroTag: { fontSize: 11, fontWeight: '800', color: '#059669', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' },
  heroHeading: { fontSize: 34, fontWeight: '900', color: '#0f172a', lineHeight: 40, marginBottom: 14, letterSpacing: -0.5 },
  heroSubtext: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 24 },
  heroCtaBtn: { backgroundColor: '#059669', borderRadius: 14, paddingVertical: 18, alignItems: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  heroCtaText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', letterSpacing: 0.3 },

  featuresContainer: { gap: 14 },
  etheraCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'flex-start', gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#64748b', lineHeight: 18 },

  dashboardContainer: { padding: 20, paddingBottom: 40 },
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  dashSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0284c7' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#0284c7' },
  backButton: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8 },
  backButtonText: { color: '#64748b', fontWeight: 'bold', fontSize: 13 },
  
  penaltyWarningCard: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 16, padding: 20, marginBottom: 24 },
  penaltyWarningTitle: { color: '#991b1b', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  penaltyWarningDesc: { color: '#b91c1c', fontSize: 13, lineHeight: 20 },
  penaltyBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  penaltyBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },

  amountInput: { backgroundColor: '#f1f5f9', borderRadius: 16, fontSize: 40, fontWeight: 'bold', textAlign: 'center', paddingVertical: 24, color: '#059669', marginBottom: 16 },
  quickAmountRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  quickAmountChip: { flex: 1, backgroundColor: '#e2e8f0', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  quickAmountText: { fontWeight: 'bold', color: '#475569', fontSize: 14 },
  paymentInfoBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 16, marginBottom: 24 },
  paymentInfoTitle: { color: '#166534', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  paymentInfoDesc: { color: '#15803d', fontSize: 12, lineHeight: 18 },

  vaultCard: { backgroundColor: '#059669', borderRadius: 24, padding: 24, shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginBottom: 24 },
  vaultLabel: { color: '#d1fae5', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  vaultAmount: { color: '#ffffff', fontSize: 36, fontWeight: '900', marginBottom: 4 },
  vaultTarget: { color: '#a7f3d0', fontSize: 14, fontWeight: '500', marginBottom: 24 },
  progressTrack: { height: 8, backgroundColor: '#047857', borderRadius: 4, marginBottom: 24, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#facc15', borderRadius: 4 },
  topUpBtn: { backgroundColor: '#facc15', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  topUpBtnText: { color: '#0f172a', fontSize: 15, fontWeight: 'bold' },
  
  actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBox: { flex: 1, backgroundColor: '#ffffff', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  actionIcon: { fontSize: 24, marginBottom: 8 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  actionBoxSmall: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e0f2fe', borderRadius: 8 },
  actionTextSmall: { color: '#0284c7', fontWeight: 'bold', fontSize: 13 },
  
  activityCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12, marginBottom: 12 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  activityDate: { fontSize: 12, color: '#64748b', marginTop: 4 },
  activityAmountPositive: { fontSize: 15, fontWeight: 'bold', color: '#059669' },

  moveOutCard: { backgroundColor: '#0284c7', borderRadius: 16, padding: 20, marginBottom: 24 },
  moveOutTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  moveOutDesc: { color: '#bae6fd', fontSize: 13, marginBottom: 16, lineHeight: 20 },
  moveOutBtn: { backgroundColor: '#ffffff', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  moveOutBtnText: { color: '#0284c7', fontWeight: 'bold', fontSize: 14 },
  houseCard: { width: 200, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 16, padding: 12 },
  houseImagePlaceholder: { height: 100, backgroundColor: '#f1f5f9', borderRadius: 8, marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  houseTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  housePrice: { fontSize: 13, color: '#059669', fontWeight: '600', marginBottom: 12 },
  bookBtn: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  bookBtnText: { color: '#475569', fontWeight: '600', fontSize: 13 },

  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  header: { alignItems: 'center', marginBottom: 24 },
  stepText: { fontSize: 12, fontWeight: '700', color: '#059669', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b' },
  formSpace: { gap: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0f172a' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#ffffff' },
  chipActive: { borderColor: '#059669', backgroundColor: '#ecfdf5' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#047857', fontWeight: 'bold' },
  chipActiveBlue: { borderColor: '#0284c7', backgroundColor: '#e0f2fe' },
  chipTextActiveBlue: { color: '#0369a1', fontWeight: 'bold' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 24 },
  toggleTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  toggleDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  primaryButton: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginRight: 8, backgroundColor: '#ffffff' },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  buttonRow: { flexDirection: 'row', alignItems: 'center' },
});