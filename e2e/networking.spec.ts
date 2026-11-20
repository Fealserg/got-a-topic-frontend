import { test, expect } from '@playwright/test';

test('landing is readable and has no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading',{name:/Есть что обсудить/})).toBeVisible();
  await page.getByRole('button',{name:'Найти своего собеседника'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Как вас зовут')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('invite and accept through the real UI and separate user sessions',async({browser,baseURL,viewport,isMobile,hasTouch,userAgent})=>{
  const options={viewport,isMobile,hasTouch,userAgent};
  const first=await browser.newContext(options);const second=await browser.newContext(options);
  try{
    const suffix=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    const profiles=[];
    for(const [i,context] of [first,second].entries()){
      const page=await context.newPage();await page.goto(baseURL!);
      const username=`e2e${i}${suffix}`;
      const headers={'X-Requested-With':'pereryv','Origin':baseURL!};
      const registration=await context.request.post(`${baseURL}/api/auth/register`,{headers,data:{username,password:'BrowserTest2026!',name:`Тест ${i} ${suffix}`}});
      expect(registration.status()).toBe(201);
      const config=await(await context.request.get(`${baseURL}/api/config`)).json();
      const slots=config.slots.filter((s:{starts_at:number})=>s.starts_at>Date.now()/1000);
      expect(slots.length,'Seed demo data or create a future slot before E2E').toBeGreaterThan(0);
      const r=await context.request.put(`${baseURL}/api/me`,{headers,data:{name:`Тест ${i} ${suffix}`,role:'Тестовый участник',company:'E2E',bio:'Автоматическая проверка',wanted:[config.topics[0].id],offered:[config.topics[0].id],availability:[slots[0].id],visible:true}});
      expect(r.ok()).toBe(true);profiles.push({page,context,username,name:`Тест ${i} ${suffix}`});
    }
    const [a,b]=profiles;await a.page.reload();
    const card=a.page.locator('article.person-card').filter({has:a.page.getByRole('heading',{name:b.name,exact:true})});
    await card.getByRole('button',{name:'Пригласить',exact:true}).click();
    await a.page.getByRole('button',{name:'Отправить приглашение'}).click();
    await expect(a.page.getByRole('status')).toContainText('Приглашение отправлено');
    await b.page.reload();await b.page.getByRole('button',{name:/Мои встречи/}).click();
    await b.page.getByRole('button',{name:'Принять приглашение'}).click();
    await expect(b.page.getByText('Встреча назначена',{exact:true})).toBeVisible();
    await a.page.reload();await a.page.getByRole('button',{name:/Мои встречи/}).click();
    await expect(a.page.getByText('Встреча назначена',{exact:true})).toBeVisible();
  }finally{
    for(const context of [first,second]){await context.request.delete(`${baseURL}/api/me`,{headers:{'X-Requested-With':'pereryv','Origin':baseURL!}});await context.close();}
  }
});


test('registration validates a field on blur and clears its error after correction',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Найти своего собеседника'}).click();
 const username=page.locator('input[name="username"]');
 await username.fill('bad!');await username.blur();
 await expect(username).toHaveAttribute('aria-invalid','true');
 await expect(page.locator('#error-username')).toContainText('Используйте');
 await username.fill('valid-name');
 await expect(username).toHaveAttribute('aria-invalid','false');
 await expect(page.locator('#error-username')).toHaveCount(0);
});

test('unsaved profile changes require confirmation and can be retained',async({page,baseURL})=>{
 await page.goto('/');
 const headers={'X-Requested-With':'pereryv','Origin':baseURL!};
 const username=`draft${Date.now().toString(36)}${Math.random().toString(36).slice(2,5)}`;
 try{
  expect((await page.request.post('/api/auth/register',{headers,data:{username,password:'BrowserTest2026!',name:'Проверка черновика'}})).status()).toBe(201);
  await page.reload();
  await page.getByRole('button',{name:'Мой профиль',exact:true}).click();
  await page.locator('input[name="name"]').fill('Несохранённое имя');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Найти собеседника',exact:true}).click();
  await expect(page.locator('input[name="name"]')).toHaveValue('Несохранённое имя');
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Найти собеседника',exact:true}).click();
  await expect(page.getByRole('heading',{name:/Есть что обсудить/})).toBeVisible();
  const me=await(await page.request.get('/api/me')).json();
  expect(me.name).toBe('Проверка черновика');
 }finally{
  await page.request.delete('/api/me',{headers});
 }
});
