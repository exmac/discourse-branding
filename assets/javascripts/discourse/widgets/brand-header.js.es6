import { createWidget, applyDecorators } from 'discourse/widgets/widget';
import { iconNode } from 'discourse/helpers/fa-icon-node';
import { h } from 'virtual-dom';

const flatten = array => [].concat.apply([], array);

createWidget('nav-links', {
  tagName: 'nav.links',

  html(attrs) {
    const links = [].concat(attrs.contents());
    const liOpts = { };

    const result = [];
    result.push(h('ul.nav.nav-pills', links.map(l => h('li', liOpts, l))));

    return result;
  }
});

createWidget('nav-icons', {
  tagName: 'nav.icons',

  html(attrs) {
    const links = [].concat(attrs.contents());
    const liOpts = { };

    const result = [];
    result.push(h('ul', links.map(l => h('li', liOpts, l))));

    return result;
  }
});

export default createWidget('brand-header', {
  tagName: 'header.b-header.clearfix',
  buildKey: () => `header`,

  defaultState() {
    let states =  {
      hamburgerVisible: false,
    };

    return states;
  },

  toggleHamburger() {
    this.state.hamburgerVisible = !this.state.hamburgerVisible;
  },

  defaultState() {
    return { generalLinks: [], iconLinks: [], loading: true};
  },

  loadNavigation() {
    const self = this;
    const generalLinks = [];
    const iconLinks = [];
    this.store.findAll('menu-link').then(function(rs) {
      rs.content.forEach(function(l) {
        if(l.visible_brand_general) {
          self.state.generalLinks.push({ href: l.url, rawLabel: l.name });
        }
        if(l.visible_brand_icon) {
          self.state.iconLinks.push({ href: l.url, icon: l.icon, name: l.name });
        }
      });
      self.state.loading = false;
      self.state.generalLinks.concat(generalLinks);
      self.state.iconLinks.concat(iconLinks);
      self.scheduleRerender();
    });
  },

  generalLinks() {
    var links = [];
    const { siteSettings } = this;

    if(siteSettings.brand_home_link_enabled) {
      links.push({ href: siteSettings.brand_url, className: 'brand-home-link', label: 'brand.home' });
    }

    links = links.concat(this.state.generalLinks);

    const extraLinks = flatten(applyDecorators(this, 'generalLinks', this.attrs, this.state));
    links = links.concat(extraLinks);
    return links.map(l => this.attach('link', l));
  },

  iconLinks() {
    var links = [];

    links = links.concat(this.state.iconLinks);

    const extraLinks = flatten(applyDecorators(this, 'iconLinks', this.attrs, this.state));
    links = links.concat(extraLinks);
    return links.map(l => h('a.icon', {attributes: { title: l.name, href: l.href }}, [iconNode(l.icon)]));
  },

  html(attrs, state) {
    const { siteSettings } = this;
    const mobileView = this.site.mobileView;

    const contents = [];

    contents.push(this.attach('brand-logo'));

    if(mobileView) {
      const hamburger = this.attach('header-dropdown', {
                              title: 'hamburger_brand_menu',
                              icon: 'bars',
                              iconId: 'toggle-hamburger-brand-menu',
                              active: attrs.hamburgerVisible,
                              action: 'toggleHamburger'
                            });
      contents.push(hamburger);

      if (state.hamburgerVisible) {
        contents.push(this.attach('hamburger-brand-menu'), { generalLinks: this.generalLinks(), iconLinks: this.iconLinks() });
      }
    } else {
      contents.push(this.attach('nav-links', { contents: () => this.generalLinks() }));
      contents.push(this.attach('nav-icons', { contents: () => this.iconLinks() }));
    }

    if(this.state.loading) {
      if(siteSettings.navigation_enabled) {
        this.loadNavigation();
      }
    }

    return h('div.wrap', h('div.contents.clearfix', contents));
  }

});
